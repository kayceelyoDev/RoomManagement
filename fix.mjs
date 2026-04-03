import fs from 'fs';
const file = 'resources/js/pages/reservations/modal/AddReservation.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replaceAll('bg-[#FFFDE1]', 'bg-background')
     .replaceAll('text-[#FFFDE1]', 'text-background')
     .replaceAll('border-[#FFFDE1]', 'border-background')
     .replaceAll('bg-white', 'bg-card')
     .replaceAll('text-white', 'text-card-foreground')
     .replaceAll('bg-[#2C3930]', 'bg-foreground')
     .replaceAll('text-[#2C3930]', 'text-foreground')
     .replaceAll('border-[#2C3930]', 'border-foreground')
     .replaceAll('shadow-[#2C3930]', 'shadow-foreground')
     .replaceAll('bg-[#628141]', 'bg-primary')
     .replaceAll('text-[#628141]', 'text-primary')
     .replaceAll('border-[#628141]', 'border-primary')
     .replaceAll('ring-[#628141]', 'ring-primary')
     .replaceAll('shadow-[#628141]', 'shadow-primary')
     .replaceAll('from-[#628141]', 'from-primary')
     .replaceAll('bg-[#D8E983]', 'bg-secondary')
     .replaceAll('text-[#D8E983]', 'text-secondary')
     .replaceAll('border-[#D8E983]', 'border-secondary')
     .replaceAll('text-destructive', 'text-destructive')
     .replaceAll('bg-destructive', 'bg-destructive');

fs.writeFileSync(file, c);
console.log('Colors replaced successfully!');
