<?php

namespace App\Services;

use App\Enum\ReservationEnum;
use App\Mail\ReservationCancellationMain;
use App\Mail\ReservationConfirmed;
use App\Mail\ReservationReceiptEmail;
use App\Models\Reservation;
use App\Models\Rooms;
use App\Models\Services;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Mail\Mailable;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class ReservationServices
{
    private const BUFFER_HOURS = 3;

    protected function checkAvailability($roomId, $checkIn, $checkOut, int|string|null $excludeId = null): void
    {
        Log::debug('checkAvailability called', [
            'roomId' => $roomId,
            'checkIn' => $checkIn,
            'checkOut' => $checkOut,
            'excludeId' => $excludeId,
            'bufferHours' => self::BUFFER_HOURS
        ]);

        $newStart = Carbon::parse($checkIn);

       
        $newEnd = Carbon::parse($checkOut)->addHours(self::BUFFER_HOURS);

     
     
        $thresholdTime = $newStart->copy()->subHours(self::BUFFER_HOURS);

        $activeStatuses = [
            ReservationEnum::Pending->value,
            ReservationEnum::Confirmed->value,
            ReservationEnum::CheckedIn->value,
            ReservationEnum::CheckedOut->value,
        ];

        Log::debug('Checking for conflicts', [
            'thresholdTime' => $thresholdTime->toDateTimeString(),
            'newEnd' => $newEnd->toDateTimeString(),
            'activeStatuses' => $activeStatuses
        ]);

        $conflict = Reservation::select('id', 'check_out_date')
            ->where('room_id', $roomId)
            ->whereIn('status', $activeStatuses)
            ->where(function ($query) use ($newEnd, $thresholdTime) {
                // 1. Existing Start < New End (with buffer)
                $query->where('check_in_date', '<', $newEnd)
                    // 2. Existing End > Threshold (New Start - Buffer)
                    // This replaces the raw DATE_ADD SQL
                    ->where('check_out_date', '>', $thresholdTime);
            })
            ->when($excludeId, function ($query, $id) {
                $query->where('id', '!=', $id);
            })
            ->first();

        if ($conflict) {
            Log::warning('Reservation conflict detected', [
                'conflictId' => $conflict->id,
                'conflictCheckOut' => $conflict->check_out_date
            ]);
            $conflictEnd = Carbon::parse($conflict->check_out_date);
            // Calculate strictly when the room is ready (Checkout + Buffer)
            $readyTime = $conflictEnd->copy()->addHours(self::BUFFER_HOURS);

            throw ValidationException::withMessages([
                'check_in_date' => [
                    "Conflict detected. This room is occupied or being cleaned until " . $readyTime->format('M d, h:i A') . "."
                ]
            ]);
        } else {
            Log::debug('No conflicts found - room is available', ['roomId' => $roomId]);
        }
    }

    public function checkServices(array $extraServices, int $roomId){

        // Load the room with its category to access both limits
        $room = Rooms::with('roomCategory')->find($roomId);
        $maxExtraBed    = $room?->roomCategory?->max_extra_bed;   // from room_categories
        $maxExtraPerson = $room?->max_extra_person;                // from rooms

        $extraPersonQuantity = 0;
        $extraBedQuantity    = 0;

        foreach ($extraServices as $service) {
            $serviceName = Services::where('id', $service['id'])->value('services_name');
            if (!$serviceName) continue;

            $nameLower = strtolower(trim($serviceName));
            $qty       = (int) ($service['quantity'] ?? 1);

            // Count "extra person" services
            if (str_contains($nameLower, 'extra person')) {
                $extraPersonQuantity += $qty;
            }

            // Count "extra bed" services
            if (str_contains($nameLower, 'extra bed')) {
                $extraBedQuantity += $qty;
            }
        }

        Log::info("DEBUGGING_SERVICE_LIMITS", [
            'maxExtraPerson'      => $maxExtraPerson,
            'maxExtraBed'         => $maxExtraBed,
            'extraPersonQuantity' => $extraPersonQuantity,
            'extraBedQuantity'    => $extraBedQuantity,
        ]);

        // Enforce extra person limit (from rooms table)
        if ($extraPersonQuantity > 0 && !is_null($maxExtraPerson) && $extraPersonQuantity > $maxExtraPerson) {
            throw ValidationException::withMessages([
                'selected_services' => [
                    "Extra Person limit exceeded. This room allows a maximum of {$maxExtraPerson} extra person(s). You selected {$extraPersonQuantity}."
                ]
            ]);
        }

        // Enforce extra bed limit (from room_categories table)
        if ($extraBedQuantity > 0 && !is_null($maxExtraBed) && $extraBedQuantity > $maxExtraBed) {
            throw ValidationException::withMessages([
                'selected_services' => [
                    "Extra Bed limit exceeded. This room category allows a maximum of {$maxExtraBed} extra bed(s). You selected {$extraBedQuantity}."
                ]
            ]);
        }

        return true;
    }

    public function createReservation(array $data, ?string $ip = null): Reservation
    {
       
        $user = Auth::user();

        if ($ip) {
            $key = 'reservation-create:' . ($user?->id ?: $ip);

            if (RateLimiter::tooManyAttempts($key, 3)) {
                $seconds = RateLimiter::availableIn($key);
                throw ValidationException::withMessages([
                    'rate_limit' => "Too many reservation attempts. Please try again in {$seconds} seconds."
                ]);
            }

            RateLimiter::hit($key, 60);
        }

        $data['user_id'] = $user?->id;
        if (Gate::allows('acces-guest')) {
            $data['guest_email'] = $user?->email;
        }

        Log::info('Creating new reservation', [
            'guest_name' => $data['guest_name'] ?? 'N/A',
            'room_id' => $data['room_id'] ?? 'N/A',
            'check_in' => $data['check_in_date'] ?? 'N/A',
            'check_out' => $data['check_out_date'] ?? 'N/A'
        ]);

        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');
        $data['room_id'] = (int) $data['room_id'];
        unset($data['g-recaptcha-response']);

        Log::debug('Parsed dates and room_id', [
            'check_in_date' => $data['check_in_date'],
            'check_out_date' => $data['check_out_date'],
            'room_id' => $data['room_id']
        ]);

        $this->checkAvailability(
            $data['room_id'],
            $data['check_in_date'],
            $data['check_out_date']
        );

        $servicesData = Arr::pull($data, 'selected_services', []);
        
        $this->checkServices($servicesData, $data['room_id']);

        Log::debug('Services data extracted', [
            'serviceCount' => count($servicesData),
            'services' => $servicesData
        ]);

        return DB::transaction(function () use ($data, $servicesData) {
            $data['status'] = $data['status'] ?? ReservationEnum::Pending->value;

            Log::debug('Creating reservation in database', [
                'status' => $data['status'],
                'amount' => $data['reservation_amount'] ?? 'N/A'
            ]);

            $reservation = Reservation::create($data);

            Log::info('Reservation created successfully', [
                'reservationId' => $reservation->id,
                'status' => $reservation->status
            ]);

            if (!empty($servicesData)) {
                Log::debug('Syncing services for reservation', ['reservationId' => $reservation->id]);
                $syncPayload = [];
                foreach ($servicesData as $item) {
                    $syncPayload[$item['id']] = [
                        'quantity' => $item['quantity'],
                        'total_amount' => $item['price'] * $item['quantity']
                    ];
                    Log::debug('Added service to sync', [
                        'serviceId' => $item['id'],
                        'quantity' => $item['quantity'],
                        'totalAmount' => $item['price'] * $item['quantity']
                    ]);
                }
                $reservation->services()->sync($syncPayload);
                Log::info('Services synced successfully', ['reservationId' => $reservation->id, 'count' => count($syncPayload)]);
            } else {
                Log::debug('No services to sync', ['reservationId' => $reservation->id]);
            }

            if ($reservation->user && $reservation->guest_email) {
                Log::debug('Dispatching confirmation email', [
                    'reservationId' => $reservation->id,
                    'email' => $reservation->guest_email
                ]);
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationConfirmed($reservation));
            } else {
                Log::debug('Email not sent - missing user or guest_email', [
                    'hasUser' => !!$reservation->user,
                    'guestEmail' => $reservation->guest_email
                ]);
            }

            Log::info("Reservation Created: #{$reservation->id}");

            return $reservation;
        });
    }

    public function updateReservation(Reservation $reservation, array $data): Reservation
    {
        
        Log::info('Updating reservation', [
            'reservationId' => $reservation->id,
            'currentStatus' => $reservation->status,
            'newStatus' => $data['status'] ?? 'unchanged',
            'room_id' => $data['room_id'] ?? 'unchanged'
        ]);

        $data['check_in_date'] = Carbon::parse($data['check_in_date'])->format('Y-m-d H:i:s');
        $data['check_out_date'] = Carbon::parse($data['check_out_date'])->format('Y-m-d H:i:s');
        $data['room_id'] = (int) $data['room_id'];
        unset($data['g-recaptcha-response']);

        Log::debug('Parsed update data', [
            'reservationId' => $reservation->id,
            'check_in' => $data['check_in_date'],
            'check_out' => $data['check_out_date'],
            'room_id' => $data['room_id']
        ]);

        

        $servicesData = Arr::pull($data, 'selected_services', []);

        Log::debug('Services data for update', [
            'serviceCount' => count($servicesData),
            'services' => $servicesData
        ]);

        return DB::transaction(function () use ($reservation, $data, $servicesData) {
            Log::debug('Updating reservation in database', [
                'reservationId' => $reservation->id,
                'updateData' => $data
            ]);

            $reservation->update($data);
            $reservation->refresh();

            Log::info('Reservation updated in database', [
                'reservationId' => $reservation->id,
                'newStatus' => $reservation->status
            ]);

            // Using strictly enum values to prevent typed bug errors on updates
            $statusValue = $reservation->status instanceof ReservationEnum
                ? $reservation->status->value
                : $reservation->status;

            Log::debug('Checking status for email dispatch', [
                'statusValue' => $statusValue,
                'isEnum' => $reservation->status instanceof ReservationEnum
            ]);

            if ($statusValue == ReservationEnum::Cancelled->value) {
                Log::debug('Sending cancellation email', ['reservationId' => $reservation->id]);
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationCancellationMain($reservation));
            } elseif ($statusValue == ReservationEnum::Confirmed->value) {
                Log::debug('Sending receipt email', ['reservationId' => $reservation->id]);
                $this->dispatchEmailSafely($reservation->guest_email, new ReservationReceiptEmail($reservation));
            } else {
                Log::debug('No email dispatched for status', ['statusValue' => $statusValue]);
            }

            Log::debug('Building sync payload for update', ['reservationId' => $reservation->id]);
            $syncPayload = [];
            foreach ($servicesData as $item) {
                $syncPayload[$item['id']] = [
                    'quantity' => $item['quantity'],
                    'total_amount' => $item['price'] * $item['quantity']
                ];
                Log::debug('Added service to update sync', [
                    'serviceId' => $item['id'],
                    'quantity' => $item['quantity'],
                    'totalAmount' => $item['price'] * $item['quantity']
                ]);
            }

            $reservation->services()->sync($syncPayload);
            Log::info('Services synced on update', ['reservationId' => $reservation->id, 'count' => count($syncPayload)]);

            Log::info("Reservation Updated: #{$reservation->id}");

            return $reservation;
        });
    }

    public function getPaginatedReservations(array $filters): LengthAwarePaginator
    {
        $search = $filters['search'] ?? null;

        return Reservation::query()
            ->with([
                'room:id,room_name,room_categories_id',
                'services:id,services_name'
            ])
            ->when($search, function ($query, string $term) {
                $searchTerm = '%' . strtolower($term) . '%';
                $query->where(function ($q) use ($searchTerm, $term) {
                    $q->whereRaw('LOWER(guest_name) LIKE ?', [$searchTerm])
                        ->orWhere('contact_number', 'like', "%{$term}%")
                        ->orWhereHas('room', fn($subQ) => $subQ->whereRaw('LOWER(room_name) LIKE ?', [$searchTerm]));
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();
    }

    public function getDashboardStats(): array
    {
        $today = Carbon::today();

        $aggregates = Reservation::toBase()
            ->selectRaw("SUM(CASE WHEN status != ? THEN reservation_amount ELSE 0 END) as total_revenue", [ReservationEnum::Cancelled->value])
            ->selectRaw("COUNT(CASE WHEN status = ? THEN 1 END) as pending_count", [ReservationEnum::Pending->value])
            ->first();

        $arrivals = Reservation::query()
            ->whereDate('check_in_date', $today)
            ->where('status', '!=', ReservationEnum::Cancelled->value)
            ->count();

        $departures = Reservation::query()
            ->whereDate('check_out_date', $today)
            ->where('status', '!=', ReservationEnum::Cancelled->value)
            ->count();

        return [
            'total_revenue' => (float) ($aggregates->total_revenue ?? 0),
            'arrivals_today' => (int) $arrivals,
            'departures_today' => (int) $departures,
            'pending_count' => (int) ($aggregates->pending_count ?? 0),
        ];
    }

    public function getRoomsForAdmin(): Collection
    {
        return Rooms::select('id', 'room_name', 'room_categories_id', 'max_extra_person', 'status')
            ->with([
                'roomCategory',
                'reservations' => fn($query) => $query->select('id', 'room_id', 'check_in_date', 'check_out_date', 'status')
                    ->where('status', '!=', ReservationEnum::Cancelled->value)
                    ->whereDate('check_out_date', '>=', now()->toDateString())
            ])
            ->get();
    }

    public function getServicesForAdmin(): Collection
    {
        return Services::select('id', 'services_name', 'services_price')->get();
    }

    public function deleteReservation(Reservation $reservation): void
    {
        DB::transaction(function () use ($reservation) {
            $reservation->services()->detach();
            $reservation->delete();
        });

        Log::info("Reservation #{$reservation->id} deleted by Admin " . Auth::id());
    }

    /**
     * Dispatch an email safely, catching exceptions so the main thread doesn't crash.
     */
    private function dispatchEmailSafely(?string $email, Mailable $mailable): void
    {
        if (!$email) {
            Log::warning('Email dispatch skipped - no email address provided');
            return;
        }

        try {
            Log::debug('Queuing email', [
                'email' => $email,
                'mailableClass' => get_class($mailable)
            ]);
            Mail::to($email)->queue($mailable);
            Log::info('Email queued successfully', [
                'email' => $email,
                'mailableClass' => get_class($mailable)
            ]);
        } catch (\Throwable $e) {
            Log::error("Email Error: " . $e->getMessage(), [
                'email' => $email,
                'mailableClass' => get_class($mailable),
                'exception' => get_class($e)
            ]);
        }
    }
}
