<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation Cancelled - Estaca Bay</title>
    <style>
        /* Email client resets */
        body { margin: 0; padding: 0; min-width: 100%; background-color: #F9FAFB; }
        table { border-spacing: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        td { padding: 0; }
        img { border: 0; }
        a { text-decoration: none; color: inherit; }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F9FAFB; color: #2C3930; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025); width: 100%; max-width: 600px;">
                    
                    <tr>
                        <td align="center" style="background-color: #2C3930; padding: 40px 0;">
                            <img src="{{ asset('/img/logo.jpg') }}" alt="Estaca Bay Resort" width="70" height="70" style="display: block; border-radius: 50%; border: 3px solid #FFFDE1; margin-bottom: 15px; background-color: #fff;" />
                            <h1 style="margin: 0; color: #FFFDE1; font-family: 'Georgia', serif; font-size: 26px; font-weight: normal; letter-spacing: 1px;">ESTACA BAY</h1>
                            <p style="margin: 5px 0 0; color: #D8E983; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">Resort & Sanctuary</p>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding: 40px 40px;">
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #FEF2F2; border-radius: 50%; width: 60px; height: 60px; display: inline-block; line-height: 60px; margin-bottom: 20px;">
                                            <span style="font-size: 30px; color: #EF4444;">&times;</span>
                                        </div>
                                        <h2 style="margin: 0 0 15px; color: #1F2937; font-size: 24px; font-weight: bold;">Reservation Cancelled</h2>
                                        <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #6B7280;">
                                            Dear <strong>{{ $reservation->guest_name }}</strong>,<br>
                                            We've processed your cancellation request.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; margin-top: 30px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 1px solid #E5E7EB; padding-bottom: 15px; margin-bottom: 15px;">
                                            <tr>
                                                <td style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #9CA3AF; letter-spacing: 1px;">Reference</td>
                                                <td style="text-align: right; font-size: 14px; font-weight: bold; color: #2C3930;">#{{ str_pad($reservation->id, 6, '0', STR_PAD_LEFT) }}</td>
                                            </tr>
                                        </table>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; vertical-align: top; padding-bottom: 5px;">Room Type</td>
                                                <td style="text-align: right; color: #111827; font-weight: 600; font-size: 14px; padding-bottom: 5px;">{{ $reservation->room->room_name ?? 'Room' }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #9CA3AF; font-size: 12px;">Guests</td>
                                                <td style="text-align: right; color: #6B7280; font-size: 12px;">{{ $reservation->total_guest }} Persons</td>
                                            </tr>
                                        </table>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #E5E7EB;">
                                            <tr>
                                                <td width="50%" style="vertical-align: top;">
                                                    <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase; font-weight: bold;">Check-in</p>
                                                    <p style="margin: 4px 0 0; font-size: 14px; color: #4B5563; text-decoration: line-through;">{{ \Carbon\Carbon::parse($reservation->check_in_date)->format('M d, Y') }}</p>
                                                </td>
                                                <td width="50%" style="vertical-align: top; text-align: right;">
                                                    <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase; font-weight: bold;">Check-out</p>
                                                    <p style="margin: 4px 0 0; font-size: 14px; color: #4B5563; text-decoration: line-through;">{{ \Carbon\Carbon::parse($reservation->check_out_date)->format('M d, Y') }}</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; background-color: #FEF2F2; border-radius: 6px; padding: 10px;">
                                            <tr>
                                                <td align="center" style="font-size: 12px; color: #B91C1C; font-weight: 500;">
                                                    Cancelled on {{ now()->format('F j, Y \a\t g:i A') }}
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="text-align: center; font-size: 13px; color: #6B7280; margin-top: 20px; line-height: 1.5;">
                                No payment has been charged for this reservation. <br>
                                <span style="font-size: 12px; color: #9CA3AF;">Amount Due: ₱0.00</span>
                            </p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 35px;">
                                <tr>
                                    <td align="center">
                                        <p style="font-size: 14px; color: #374151; margin-bottom: 15px; font-weight: 500;">Change of plans? Book with us again.</p>
                                        <a href="{{ url('/') }}" style="background-color: #2C3930; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; letter-spacing: 0.5px; display: inline-block; box-shadow: 0 4px 6px rgba(44, 57, 48, 0.2);">
                                            Find a Room
                                        </a>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="background-color: #F3F4F6; padding: 25px; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.5;">
                                &copy; {{ date('Y') }} Estaca Bay Resort. All rights reserved.<br>
                                Compostela, Cebu, Philippines
                            </p>
                            <p style="margin: 10px 0 0; font-size: 11px;">
                                <a href="#" style="color: #9CA3AF; text-decoration: underline;">Privacy Policy</a> &nbsp;|&nbsp; 
                                <a href="#" style="color: #9CA3AF; text-decoration: underline;">Contact Support</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>