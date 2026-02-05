<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation Cancelled - Estaca Bay</title>
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
                            
                            <h2 style="margin-top: 0; color: #c62828; font-size: 20px;">Reservation Cancelled</h2>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #555555;">
                                Dear <strong>{{ $reservation->guest_name }}</strong>,
                            </p>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #555555;">
                                As requested, your reservation has been successfully cancelled. We hope to have the opportunity to welcome you to Estaca Bay in the future.
                            </p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td style="background-color: #fff5f5; border: 1px solid #ffcdd2; border-left: 4px solid #c62828; padding: 15px; border-radius: 5px;">
                                        <table width="100%">
                                            <tr>
                                                <td style="color: #b71c1c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Status</td>
                                                <td style="color: #b71c1c; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; text-align: right;">Cancelled Date</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #c62828; font-size: 16px; font-weight: bold;">CANCELLED</td>
                                                <td style="color: #c62828; font-size: 14px; font-weight: bold; text-align: right;">{{ now()->format('F j, Y') }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 30px;">
                                <tr>
                                    <td colspan="2" style="border-bottom: 2px solid #f0f0f0; padding-bottom: 10px; margin-bottom: 10px;">
                                        <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #777; letter-spacing: 1px;">Cancelled Booking Details</span>
                                    </td>
                                </tr>
                                
                                <tr>
                                    <td style="padding: 15px 0; color: #777; font-size: 14px; width: 70%; vertical-align: top;">
                                        <strong>Room Reservation</strong> ({{ $reservation->total_guest }} Guests)<br>
                                        <span style="font-size: 12px; color: #999; display: block; margin-top: 4px;">
                                            Original Check-in: {{ \Carbon\Carbon::parse($reservation->check_in_date)->format('M d, Y') }}<br>
                                            Original Check-out: {{ \Carbon\Carbon::parse($reservation->check_out_date)->format('M d, Y') }}
                                        </span>
                                    </td>
                                    <td style="padding: 15px 0; color: #777; font-size: 14px; font-weight: bold; text-align: right; vertical-align: top; text-decoration: line-through;">
                                        ₱{{ number_format($reservation->reservation_amount, 2) }}
                                    </td>
                                </tr>

                                <tr style="border-top: 2px solid #eee;">
                                    <td style="padding: 15px 0; color: #555; font-size: 16px; font-weight: bold;">Amount Due</td>
                                    <td style="padding: 15px 0; color: #555; font-size: 20px; font-weight: bold; text-align: right;">
                                        ₱0.00
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 40px;">
                                <tr>
                                    <td align="center">
                                        <p style="font-size: 13px; color: #777; margin-bottom: 15px;">Did you cancel by mistake? Check availability to book again.</p>
                                        <a href="{{ url('/') }}" style="background-color: #2C3930; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                                            Find a Room
                                        </a>
                                    </td>
                                </tr>
                            </table>

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