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
                            
                            <h2 style="margin: 0 0 20px; color: #1F2937; font-size: 22px; font-weight: bold; text-align: center;">Reservation Cancelled</h2>
                            
                            <p style="margin: 0 0 25px; font-size: 16px; line-height: 1.6; color: #4B5563; text-align: center;">
                                Dear <strong>{{ $reservation->guest_name }}</strong>,<br>
                                @if(isset($isAutoCancelled) && $isAutoCancelled)
                                    We are writing to inform you that your reservation request has been automatically cancelled by our system.
                                @else
                                    We are writing to confirm that your reservation has been successfully cancelled as requested.
                                @endif
                            </p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
                                <tr>
                                    <td style="background-color: #FEF2F2; border: 1px solid #FCA5A5; border-radius: 8px; padding: 15px;">
                                        <table width="100%">
                                            <tr>
                                                <td width="24" valign="top" style="padding-right: 10px;">
                                                    <span style="font-size: 18px;">🛑</span>
                                                </td>
                                                <td>
                                                    <p style="margin: 0; color: #991B1B; font-size: 13px; line-height: 1.5;">
                                                        <strong>Cancellation Details:</strong> 
                                                        @if(isset($isAutoCancelled) && $isAutoCancelled)
                                                            Your booking (ID: #{{ $reservation->id }}) was held in a pending state for over 2 hours without verification. To ensure fair availability for all guests, the room has been released.
                                                        @else
                                                            Your booking (ID: #{{ $reservation->id }}) has been cancelled. We hope to welcome you to our sanctuary at another time. 
                                                        @endif
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 30px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 1px solid #E5E7EB; padding-bottom: 15px; margin-bottom: 15px;">
                                            <tr>
                                                <td style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #9CA3AF; letter-spacing: 1px;">Cancelled Booking Details</td>
                                            </tr>
                                        </table>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 10px;">
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; vertical-align: top; padding-bottom: 8px;">Check-in</td>
                                                <td style="text-align: right; color: #111827; font-weight: 600; font-size: 14px; text-decoration: line-through; padding-bottom: 8px;">
                                                    {{ \Carbon\Carbon::parse($reservation->check_in_date)->format('M j, Y') }}
                                                    <span style="color: #9CA3AF; font-weight: normal; font-size: 12px; text-decoration: line-through;">{{ \Carbon\Carbon::parse($reservation->check_in_date)->format('g:i A') }}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; vertical-align: top; padding-bottom: 8px;">Check-out</td>
                                                <td style="text-align: right; color: #111827; font-weight: 600; font-size: 14px; text-decoration: line-through; padding-bottom: 8px;">
                                                    {{ \Carbon\Carbon::parse($reservation->check_out_date)->format('M j, Y') }}
                                                    <span style="color: #9CA3AF; font-weight: normal; font-size: 12px; text-decoration: line-through;">{{ \Carbon\Carbon::parse($reservation->check_out_date)->format('g:i A') }}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="color: #6B7280; font-size: 14px; vertical-align: top; padding-bottom: 8px;">Guests</td>
                                                <td style="text-align: right; color: #111827; font-weight: 600; font-size: 14px; padding-bottom: 8px;">{{ $reservation->total_guest }} Persons</td>
                                            </tr>
                                        </table>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px dashed #E5E7EB; padding-top: 15px;">
                                            <tr>
                                                <td style="color: #1F2937; font-size: 15px; font-weight: bold;">Status</td>
                                                <td style="text-align: right; color: #DC2626; font-size: 16px; font-weight: bold;">CANCELLED</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 25px 0;">
                                <tr>
                                    <td align="center" style="padding-bottom: 20px;">
                                        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" bgcolor="#2C3930" style="border-radius: 8px;">
                                                    <a href="{{ url('/') }}" target="_blank" style="font-size: 16px; font-weight: bold; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; border: 1px solid #2C3930; display: inline-block; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(44, 57, 48, 0.25);">
                                                        Book a New Stay
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; text-align: center; margin-top: 20px;">
                                If you have any questions or believe this was an error, please reply to this email or contact our front desk.
                            </p>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="background-color: #F3F4F6; padding: 25px; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.5;">
                                &copy; {{ date('Y') }} Estaca Bay Resort. All rights reserved.<br>
                                Compostela, Cebu, Philippines
                            </p>
                            <p style="margin: 10px 0 0; font-size: 11px;">
                                <a href="#" style="color: #9CA3AF; text-decoration: underline;">Terms of Service</a> &nbsp;|&nbsp; 
                                <a href="#" style="color: #9CA3AF; text-decoration: underline;">Contact Us</a>
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>