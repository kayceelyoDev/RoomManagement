<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Reservation - Estaca Bay</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; color: #2C3930;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-width: 100%;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    
                    <tr>
                        <td align="center" style="background-color: #2C3930; padding: 30px 0;">
                            <img src="{{ asset('/img/logo.jpg') }}" alt="Estaca Bay Resort" width="60" height="60" style="display: block; border-radius: 50%; border: 2px solid #FFFDE1; margin-bottom: 10px;" />
                            <h1 style="margin: 0; color: #FFFDE1; font-family: 'Georgia', serif; font-size: 24px; font-weight: normal; letter-spacing: 1px;">ESTACA BAY</h1>
                            <p style="margin: 5px 0 0; color: #D8E983; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Resort & Sanctuary</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 30px;">
                            
                            <h2 style="margin-top: 0; color: #2C3930; font-size: 20px;">Reservation Verification Request</h2>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #555555;">
                                Dear <strong>{{ $reservation->guest_name }}</strong>,
                            </p>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #555555;">
                                We have received your reservation request. To secure your booking at Estaca Bay Resort, please verify your email address and reservation details below.
                            </p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td style="background-color: #FFFDE1; border-left: 4px solid #D8E983; padding: 15px;">
                                        <p style="margin: 0; color: #6e6018; font-size: 14px;">
                                            <strong>Please Note:</strong> This verification link is valid for <strong>2 hours</strong>. Reservations not verified within this timeframe will be automatically cancelled to free up availability for other guests.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 30px;">
                                <tr>
                                    <td colspan="2" style="border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 10px;">
                                        <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #628141; letter-spacing: 1px;">Booking Summary</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 0; color: #777; font-size: 14px; width: 40%;">Check-in Date</td>
                                    <td style="padding: 12px 0; color: #333; font-size: 14px; font-weight: bold; text-align: right;">
                                        {{ \Carbon\Carbon::parse($reservation->check_in_date)->format('F j, Y - g:i A') }}
                                    </td>
                                </tr>
                                <tr style="border-top: 1px solid #f9f9f9;">
                                    <td style="padding: 12px 0; color: #777; font-size: 14px;">Check-out Date</td>
                                    <td style="padding: 12px 0; color: #333; font-size: 14px; font-weight: bold; text-align: right;">
                                        {{ \Carbon\Carbon::parse($reservation->check_out_date)->format('F j, Y - g:i A') }}
                                    </td>
                                </tr>
                                <tr style="border-top: 1px solid #f9f9f9;">
                                    <td style="padding: 12px 0; color: #777; font-size: 14px;">Guests</td>
                                    <td style="padding: 12px 0; color: #333; font-size: 14px; font-weight: bold; text-align: right;">
                                        {{ $reservation->total_guest }} Persons
                                    </td>
                                </tr>
                                <tr style="border-top: 1px solid #f9f9f9;">
                                    <td style="padding: 12px 0; color: #777; font-size: 14px;">Contact Number</td>
                                    <td style="padding: 12px 0; color: #333; font-size: 14px; font-weight: bold; text-align: right;">
                                        {{ $reservation->contact_number }}
                                    </td>
                                </tr>
                                <tr style="border-top: 1px solid #eee;">
                                    <td style="padding: 15px 0; color: #2C3930; font-size: 16px; font-weight: bold;">Total Amount</td>
                                    <td style="padding: 15px 0; color: #628141; font-size: 18px; font-weight: bold; text-align: right;">
                                        ₱{{ number_format($reservation->reservation_amount, 2) }}
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $url }}" style="background-color: #2C3930; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                                            Confirm Verification
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size: 13px; line-height: 1.6; color: #999999; text-align: center; margin-top: 30px;">
                                If you did not initiate this reservation, please disregard this email. No charges have been made.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="background-color: #f8f8f8; padding: 20px; border-top: 1px solid #eeeeee;">
                            <p style="margin: 0; color: #888888; font-size: 12px;">
                                &copy; {{ date('Y') }} Estaca Bay Resort. All rights reserved.<br>
                                Compostela, Cebu, Philippines
                            </p>
                        </td>
                    </tr>

                </table>
                </td>
        </tr>
    </table>

</body>
</html>