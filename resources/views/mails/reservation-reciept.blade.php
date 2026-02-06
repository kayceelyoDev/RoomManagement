<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmed - Estaca Bay</title>
    <style>
        /* Reset & Base Styles */
        body { margin: 0; padding: 0; min-width: 100%; background-color: #F3F4F6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        table { border-spacing: 0; width: 100%; }
        td { padding: 0; }
        img { border: 0; }
        a { text-decoration: none; color: inherit; }
        
        /* Mobile Responsiveness */
        @media only screen and (max-width: 600px) {
            .container { width: 100% !important; }
            .content-padding { padding: 20px !important; }
            .mobile-stack { display: block !important; width: 100% !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F3F4F6; color: #1F2937;">

    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                
                <table class="container" role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); margin: 0 auto;">
                    
                    <tr>
                        <td align="center" style="background-color: #2C3930; padding: 35px 0;">
                            <img src="{{ asset('/img/logo.jpg') }}" alt="Estaca Bay Resort" width="64" height="64" style="display: block; border-radius: 50%; border: 3px solid #FFFDE1; margin-bottom: 12px; background-color: #fff;" />
                            <h1 style="margin: 0; color: #FFFDE1; font-family: 'Georgia', serif; font-size: 24px; font-weight: normal; letter-spacing: 2px;">ESTACA BAY</h1>
                            <p style="margin: 6px 0 0; color: #D8E983; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">Resort & Sanctuary</p>
                        </td>
                    </tr>

                    <tr>
                        <td class="content-padding" style="padding: 40px 50px;">
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <div style="width: 50px; height: 50px; background-color: #ECFDF5; border-radius: 50%; display: inline-block; line-height: 50px; margin-bottom: 15px;">
                                            <span style="font-size: 24px; color: #059669;">✓</span>
                                        </div>
                                        <h2 style="margin: 0 0 10px; color: #111827; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Booking Confirmed!</h2>
                                        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #6B7280; max-width: 400px;">
                                            Get ready, <strong>{{ $reservation->guest_name }}</strong>! Your stay is officially secured. We can't wait to host you.
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 35px 0;">
                                <tr>
                                    <td align="center">
                                        <div style="background-color: #F3F4F6; border: 2px dashed #D1D5DB; border-radius: 12px; padding: 20px 40px; display: inline-block;">
                                            <p style="margin: 0 0 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #6B7280; font-weight: bold;">Reservation Reference</p>
                                            <p style="margin: 0; font-size: 32px; font-family: monospace; font-weight: 700; color: #2C3930; letter-spacing: 2px;">
                                                #{{ str_pad($reservation->id, 6, '0', STR_PAD_LEFT) }}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden;">
                                <tr>
                                    <td style="padding: 0;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="background-color: #F9FAFB; padding: 12px 20px; border-bottom: 1px solid #E5E7EB;">
                                                    <span style="font-size: 12px; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.5px;">Itinerary Details</span>
                                                </td>
                                            </tr>
                                        </table>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 20px;">
                                            <tr>
                                                <td width="50%" valign="top" style="padding-bottom: 20px;">
                                                    <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase; font-weight: 600;">Check-in</p>
                                                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #111827;">{{ \Carbon\Carbon::parse($reservation->check_in_date)->format('M d, Y') }}</p>
                                                    <p style="margin: 2px 0 0; font-size: 13px; color: #6B7280;">2:00 PM</p>
                                                </td>
                                                <td width="50%" valign="top" style="padding-bottom: 20px; border-left: 1px solid #F3F4F6; padding-left: 20px;">
                                                    <p style="margin: 0; font-size: 11px; color: #9CA3AF; text-transform: uppercase; font-weight: 600;">Check-out</p>
                                                    <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #111827;">{{ \Carbon\Carbon::parse($reservation->check_out_date)->format('M d, Y') }}</p>
                                                    <p style="margin: 2px 0 0; font-size: 13px; color: #6B7280;">12:00 PM</p>
                                                </td>
                                            </tr>
                                            
                                            <tr>
                                                <td colspan="2" style="border-top: 1px dashed #E5E7EB; padding-top: 15px; padding-bottom: 5px;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="font-size: 14px; color: #4B5563;">Room Guests</td>
                                                            <td style="font-size: 14px; color: #111827; font-weight: 600; text-align: right;">{{ $reservation->total_guest }} Persons</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="background-color: #F0FDF4; padding: 15px 20px; border-top: 1px solid #E5E7EB;">
                                                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                                        <tr>
                                                            <td style="font-size: 14px; color: #065F46; font-weight: 600;">Total Amount Due</td>
                                                            <td style="font-size: 18px; color: #059669; font-weight: 800; text-align: right;">₱{{ number_format($reservation->reservation_amount, 2) }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px;">
                                <tr>
                                    <td style="background-color: #FEF2F2; border-radius: 8px; padding: 15px; border: 1px solid #FCA5A5;">
                                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td width="20" valign="top" style="font-size: 16px;">🚨</td>
                                                <td style="padding-left: 10px;">
                                                    <p style="margin: 0 0 2px; font-size: 12px; font-weight: 700; color: #991B1B; text-transform: uppercase;">Strict Cancellation Policy</p>
                                                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #7F1D1D;">
                                                        We protect our availability. Accounts flagged for <strong>No-Shows</strong> without prior cancellation will be permanently banned. Please manage your booking online if your plans change.
                                                    </p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="background-color: #F9FAFB; padding: 30px; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 10px; color: #9CA3AF; font-size: 12px;">
                                Need help? Call us at <strong>(032) 123-4567</strong> or reply to this email.
                            </p>
                            <p style="margin: 0; color: #D1D5DB; font-size: 11px;">
                                &copy; {{ date('Y') }} Estaca Bay Resort. Compostela, Cebu.
                            </p>
                            
                            <div style="margin-top: 15px;">
                                <a href="#" style="color: #2C3930; font-size: 12px; font-weight: 600; text-decoration: none;">Manage Booking</a>
                                <span style="color: #D1D5DB; margin: 0 8px;">|</span>
                                <a href="#" style="color: #2C3930; font-size: 12px; font-weight: 600; text-decoration: none;">Get Directions</a>
                            </div>
                        </td>
                    </tr>

                </table>
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 20px;">
                    <tr>
                        <td align="center">
                            <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                                You received this email because you booked a stay at Estaca Bay.
                            </p>
                        </td>
                    </tr>
                </table>

            </td>
        </tr>
    </table>

</body>
</html>