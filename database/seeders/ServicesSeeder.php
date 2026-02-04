<?php

namespace Database\Seeders;

use App\Models\Services;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        $services = [
            ['services_name' => 'Extra Bed', 'services_price' => 500.00],
            ['services_name' => 'Breakfast Buffet', 'services_price' => 350.00],
            ['services_name' => 'Full Body Massage', 'services_price' => 800.00],
            ['services_name' => 'Airport Pickup', 'services_price' => 1200.00],
            ['services_name' => 'Bottle of Wine', 'services_price' => 1500.00],
        ];

        foreach ($services as $service) {
            Services::create($service);
        }
    }
}
