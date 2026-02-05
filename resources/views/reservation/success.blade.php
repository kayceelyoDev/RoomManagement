<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation Verified - Estaca Bay</title>
    <style>
        /* --- RESET & VARIABLES --- */
        :root {
            --color-primary: #2C3930;   /* Dark Green */
            --color-secondary: #628141; /* Olive Green */
            --color-accent: #D8E983;    /* Lime */
            --color-cream: #FFFDE1;     /* Cream Text */
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: var(--color-primary);
            color: var(--color-cream);
            height: 100vh;
            width: 100vw;
            overflow: hidden;
        }

        /* --- LAYOUT (Split Screen) --- */
        .container {
            display: flex;
            height: 100%;
            width: 100%;
        }

        /* --- LEFT SIDE (Image) --- */
        .left-pane {
            display: none; /* Hidden on mobile */
            flex: 1;
            position: relative;
            background-color: #000;
        }

        .bg-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.8;
            /* Using a placeholder image, change src to '/img/resort1.jpg' if local */
            background-image: url('/img/resort1.jpg'); 
            background-size: cover;
            background-position: center;
            transition: transform 20s ease;
        }
        
        /* Slow zoom effect */
        .left-pane:hover .bg-image { transform: scale(1.05); }

        .overlay {
            position: absolute;
            bottom: 0; left: 0; right: 0; top: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
        }

        .left-text {
            position: absolute;
            bottom: 3rem;
            left: 3rem;
            max-width: 500px;
            z-index: 10;
        }

        .left-text h2 {
            font-family: ui-serif, Georgia, Cambria, serif;
            font-size: 2.5rem;
            line-height: 1.1;
            font-weight: 700;
            text-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }

        /* --- RIGHT SIDE (Content) --- */
        .right-pane {
            flex: 1;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 2rem;
            background-color: var(--color-primary);
            overflow: hidden;
        }

        /* --- ANIMATED BACKGROUND BLOBS --- */
        .blob {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
            opacity: 0.2;
            z-index: 0;
        }
        .blob-1 {
            top: -50px; right: -50px;
            width: 300px; height: 300px;
            background-color: var(--color-accent);
            animation: float 12s ease-in-out infinite;
        }
        .blob-2 {
            bottom: -50px; left: -50px;
            width: 350px; height: 350px;
            background-color: var(--color-accent);
            animation: floatDelayed 15s ease-in-out infinite;
        }
        .blob-3 {
            top: 20%; right: 10%;
            width: 150px; height: 150px;
            background-color: var(--color-secondary);
            animation: float 10s ease-in-out infinite;
        }

        @keyframes float {
            0% { transform: translate(0, 0); }
            50% { transform: translate(-20px, 20px); }
            100% { transform: translate(0, 0); }
        }
        @keyframes floatDelayed {
            0% { transform: translate(0, 0); }
            50% { transform: translate(20px, -20px); }
            100% { transform: translate(0, 0); }
        }

        /* --- CONTENT BOX --- */
        .content-box {
            position: relative;
            z-index: 10;
            text-align: center;
            max-width: 400px;
            width: 100%;
            animation: slideUp 0.8s ease-out;
        }

        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        /* Icon */
        .icon-circle {
            width: 80px;
            height: 80px;
            background-color: rgba(255, 253, 225, 0.1);
            border: 1px solid rgba(216, 233, 131, 0.3);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem auto;
        }

        .icon-svg {
            width: 40px;
            height: 40px;
            color: var(--color-accent);
        }

        /* Text */
        h1 {
            font-family: ui-serif, Georgia, serif;
            font-size: 2.25rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--color-cream);
        }

        p {
            color: rgba(255, 253, 225, 0.7);
            font-size: 0.95rem;
            line-height: 1.6;
            margin-bottom: 2.5rem;
        }

        /* Button */
        .btn {
            display: block;
            width: 100%;
            background-color: var(--color-cream);
            color: var(--color-primary);
            text-decoration: none;
            padding: 14px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transition: all 0.3s ease;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .btn:hover {
            background-color: white;
            transform: scale(1.02);
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }

        /* Desktop Media Query */
        @media (min-width: 1024px) {
            .left-pane { display: block; }
        }

    </style>
</head>
<body>

    <div class="container">
        
        <div class="left-pane">
            <div class="bg-image"></div>
            <div class="overlay"></div>
            <div class="left-text">
                <h2>All set. <br> Your paradise awaits.</h2>
            </div>
        </div>

        <div class="right-pane">
            
            <div class="blob blob-1"></div>
            <div class="blob blob-2"></div>
            <div class="blob blob-3"></div>

            <div class="content-box">
                <div class="icon-circle">
                    <svg class="icon-svg" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <h1>Confirmed!</h1>
                
                <p>
                    Your reservation has been verified successfully.<br>
                    We have sent a receipt to your email.
                </p>

                <a href="{{ url('/dashboard') }}" class="btn">
                    Go to Dashboard
                </a>
            </div>
        </div>
    </div>

</body>
</html>