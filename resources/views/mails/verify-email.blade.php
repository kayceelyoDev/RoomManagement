<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Email - Estaca Bay</title>
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
                            
                            <h2 style="margin-top: 0; color: #2C3930; font-size: 20px; text-align: center;">Verify Your Email Address</h2>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #555555; text-align: center;">
                                Dear <strong>{{ $user->name }}</strong>,
                            </p>
                            
                            <p style="font-size: 15px; line-height: 1.6; color: #555555; text-align: center;">
                                Welcome to Estaca Bay Resort! Thanks for signing up. To verify your account and access our system, please click the button below.
                            </p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{{ $url }}" style="background-color: #2C3930; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; display: inline-block;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size: 13px; line-height: 1.6; color: #999999; text-align: center; margin-top: 30px;">
                                If you did not create an account, no further action is required.
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