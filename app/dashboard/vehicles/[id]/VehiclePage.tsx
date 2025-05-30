'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Icon, LatLngTuple } from 'leaflet';
import { usePathname, useRouter } from 'next/navigation';
import { LineChart } from '@/components/shared/line-chart-steal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Modal from '@/components/shared/obd_chart_modal';
import Maintenance from '@/components/shared/maintenance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  AlertTriangle,
  Truck,
  MapPin,
  Database,
} from 'lucide-react';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
      Loading map...
    </div>
  ),
});

const carIcon = new Icon({
  iconUrl: '/truck.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface OBDCheckData {
  engineRpm: number;
  fuelLevel: number;
  engineLoad: number;
  vehicle_id: string;
  massAirFlow: number;
  fuelPressure: number;
  vehicleSpeed: number;
  batteryVoltage: number;
  oilTemperature: number;
  distanceTraveled: number;
  throttlePosition: number;
  catalystTemperature: number;
  fuelConsumptionRate: number;
  oxygenSensorReading: number;
  intakeAirTemperature: number;
  diagnosticTroubleCode: string;
  acceleratorPedalPosition: number;
  engineCoolantTemperature: number;
  evapEmissionControlPressure: number;
  location: Location;
  timestamp: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number; // Optional
  timestamp: string;
}

type OBDData = {
  engine_rpm: number;
  vehicle_speed: number;
  throttle_position: number;
  fuel_level: number;
  engine_load: number;
  intake_air_temperature: number;
  mass_air_flow: number;
  fuel_pressure: number;
  fuel_consumption_rate: number;
  engine_coolant_temperature: number;
  oxygen_sensor_reading: number;
  catalyst_temperature: number;
  evap_emission_control_pressure: number;
  diagnostic_trouble_code: string[];
  battery_voltage: number;
  transmission_fluid_temperature: number;
  oil_temperature: number;
  oil_pressure: number;
  brake_pedal_position: number;
  steering_angle: number;
  accelerator_pedal_position: number;
  abs_status: boolean;
  airbag_deployment_status: boolean;
  tire_pressure: number;
  location: Location;
  altitude: number;
  heading: number;
  distance_traveled: number;
};

const obdData: OBDData = {
  engine_rpm: 3000,
  vehicle_speed: 80,
  throttle_position: 45.3,
  fuel_level: 60.5,
  engine_load: 50.0,
  intake_air_temperature: 35.0,
  mass_air_flow: 25.6,
  fuel_pressure: 4.8,
  fuel_consumption_rate: 10.0,
  engine_coolant_temperature: 90.0,
  oxygen_sensor_reading: 0.75,
  catalyst_temperature: 600.0,
  evap_emission_control_pressure: 2.0,
  diagnostic_trouble_code: ['P0100', 'P0200', 'P0300'],
  battery_voltage: 12.6,
  transmission_fluid_temperature: 80.0,
  oil_temperature: 95.0,
  oil_pressure: 4.5,
  brake_pedal_position: 12.3,
  steering_angle: 5.6,
  accelerator_pedal_position: 70.0,
  abs_status: true,
  airbag_deployment_status: false,
  tire_pressure: 32.0,
  location: {latitude:48.0196, longitude: 66.9237, timestamp: '2025-01-01T12:00:00Z'},
  altitude: 150.0,
  heading: 85.0,
  distance_traveled: 200.0,
};

const translationMap = {
  vehicle_id: { en: 'vehicle_id', ru: 'ID автомобиля' },
  engineRpm: { en: 'engineRpm', ru: 'Обороты двигателя' },
  fuelLevel: { en: 'fuelLevel', ru: 'Уровень топлива' },
  engineLoad: { en: 'engineLoad', ru: 'Нагрузка двигателя' },
  vehicleSpeed: { en: 'vehicleSpeed', ru: 'Скорость автомобиля' },
  massAirFlow: { en: 'massAirFlow', ru: 'Массовый расход воздуха' },
  fuelPressure: { en: 'fuelPressure', ru: 'Давление топлива' },
  batteryVoltage: { en: 'batteryVoltage', ru: 'Напряжение батареи' },
  oilTemperature: { en: 'oilTemperature', ru: 'Температура масла' },
  distanceTraveled: { en: 'distanceTraveled', ru: 'Пройденное расстояние' },
  throttlePosition: { en: 'throttlePosition', ru: 'Положение дросселя' },
  catalystTemperature: {
    en: 'catalystTemperature',
    ru: 'Температура катализатора',
  },
  fuelConsumptionRate: { en: 'fuelConsumptionRate', ru: 'Расход топлива' },
  oxygenSensorReading: {
    en: 'oxygenSensorReading',
    ru: 'Показания датчика кислорода',
  },
  intakeAirTemperature: {
    en: 'intakeAirTemperature',
    ru: 'Температура всасываемого воздуха',
  },
  diagnosticTroubleCode: {
    en: 'diagnosticTroubleCode',
    ru: 'Коды неисправностей',
  },
  acceleratorPedalPosition: {
    en: 'acceleratorPedalPosition',
    ru: 'Положение педали акселератора',
  },
  engineCoolantTemperature: {
    en: 'engineCoolantTemperature',
    ru: 'Температура охлаждающей жидкости',
  },
  evapEmissionControlPressure: {
    en: 'evapEmissionControlPressure',
    ru: 'Давление в системе контроля испарений',
  },
  transmissionFluidTemperature: {
    en: 'transmissionFluidTemperature',
    ru: 'Температура трансмиссионной жидкости',
  },
  oilPressure: { en: 'oilPressure', ru: 'Давление масла' },
  brakePedalPosition: {
    en: 'brakePedalPosition',
    ru: 'Положение педали тормоза',
  },
  steeringAngle: { en: 'steeringAngle', ru: 'Угол поворота руля' },
  absStatus: { en: 'absStatus', ru: 'Статус ABS' },
  airbagDeploymentStatus: {
    en: 'airbagDeploymentStatus',
    ru: 'Статус подушек безопасности',
  },
  tirePressure: { en: 'tirePressure', ru: 'Давление в шинах' },
  gpsCoordinates: { en: 'gpsCoordinates', ru: 'GPS координаты' },
  altitude: { en: 'altitude', ru: 'Высота' },
  heading: { en: 'heading', ru: 'Курс' },
  timestamp: { en: 'timestamp', ru: 'Дата/Время' },
};

const tripData = [
  {
    id: 1,
    driver: 'Jane Cooper',
    company: 'Microsoft',
    phone: '(225) 555-0118',
    email: 'jane@microsoft.com',
    country: 'United States',
  },
  {
    id: 2,
    driver: 'John Doe',
    company: 'Apple',
    phone: '(555) 123-4567',
    email: 'john@apple.com',
    country: 'Canada',
  },
  {
    id: 3,
    driver: 'Alice Smith',
    company: 'Google',
    phone: '(555) 987-6543',
    email: 'alice@google.com',
    country: 'United Kingdom',
  },
];

const dtcDescriptions: { [key: string]: string } = {
  P0100: 'Ошибка массового расхода воздуха',
  P0200: 'Ошибка в цепи форсунки',
  P0300: 'Пропуски зажигания',
};

interface Vehicle {
  vehicleId: string;
  licensePlate: string | null;
  vehicleType: string;
  status: string;
  currentRouteId: string | null;
  createdAt: string;
  updatedAt: string;
  obd: OBDData;
  locationId: string;
  location: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  driver: string | null;
}

interface VehiclePageProps {
  vehicleId: string;
}

const VehiclePage = ({ vehicleId }: VehiclePageProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const [vehicleData, setVehicleData] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  //Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const openModal = (title: string) => {
    setModalTitle(title);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalTitle('');
  };

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await fetch(`/api/map?vehicleId=${vehicleId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicle data');
        const data = await response.json();
        // The API returns an array, so we take the first item
        setVehicleData(Array.isArray(data) ? data[0] : data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
        setLoading(false);
      }
    };

    fetchVehicleData();
    const interval = setInterval(fetchVehicleData, 10000);
    return () => clearInterval(interval);
  }, [vehicleId]);

  const renderBack = () => (
    <div className="button-group">
      <Button onClick={() => router.back()} className="mb-8" variant="outline">
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div>
        {renderBack()}
        Loading...
      </div>
    );
  }

  if (!vehicleData) {
    return (
      <div>
        {renderBack()}
        No vehicle data found
      </div>
    );
  }

  const translatedObdData = vehicleData?.obd ? Object.entries(vehicleData.obd).map(([key, value]) => {
    const label = translationMap[key as keyof typeof translationMap]?.ru || key;
    const enkey = translationMap[key as keyof typeof translationMap]?.en || key;
    return {
      label,
      enkey,
      value
    };
  }) : [];

  const handleObdButtonClick = (enKey: string, value: number) => {
    openModal(enKey);
  };

  const convertToUserTimeZone = (item: string) => {
    // Check if 'timestamp' exists in 'item.all', otherwise use 'item.createdAt'
    const timestamp = item;

    // Parse the chosen timestamp (either 'timestamp' or 'createdAt')
    const date = new Date(timestamp);

    // Get the timezone offset in minutes
    const timeZoneOffset = new Date().getTimezoneOffset() * 60000;

    // Convert the timestamp to UTC, then adjust it by the local timezone offset
    const userDate = new Date(date.getTime());

    // Return the formatted date as a string in the user's local timezone
    return userDate.toLocaleString();
  };

  const isValidTimestamp = (value: string) => {
    // Check if the first character is a number, the last character is "Z",
    // and the second last character is a number
    return (
      !isNaN(parseInt(value.charAt(0))) &&
      value.charAt(value.length - 1) === 'Z' &&
      !isNaN(parseInt(value.charAt(value.length - 2)))
    );
  };

  const filteredData = tripData.filter((trip) =>
    trip.driver.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {renderBack()}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="mr-2" />
                  Детали автомобиля
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt>Тип:</dt>
                    <dd>{vehicleData?.vehicleType || 'Неизвестно'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Статус:</dt>
                    <dd>{vehicleData?.status || 'Неизвестно'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Номерной знак:</dt>
                    <dd>{vehicleData?.licensePlate || 'Неизвестно'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Пробег:</dt>
                    <dd>10000км</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Водитель:</dt>
                    <dd>{vehicleData?.driver || 'Неизвестно'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Map Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2" />
                  Карта
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 rounded-md overflow-hidden mb-4">
                  <Map coordinates={vehicleData?.location ? [vehicleData.location.latitude, vehicleData.location.longitude] : [0, 0]} />
                </div>
                <div className="text-sm">
                  <p>Широта: {vehicleData?.location?.latitude?.toFixed(6) ?? 'Н/Д'}</p>
                  <p>Долгота: {vehicleData?.location?.longitude?.toFixed(6) ?? 'Н/Д'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2" />
                  Данные OBD
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  {translatedObdData
                    .filter(
                      (item) =>
                        item.label !== 'Коды неисправностей' &&
                        item.label !== 'GPS координаты'
                    )
                    .map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <dt>{item.label}:</dt>
                        <dd>
                          {typeof item.value === 'number' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleObdButtonClick(item.enkey, item.value as number)}
                            >
                              {item.value.toString()}
                            </Button>
                          ) : (
                            <span>
                              {isValidTimestamp(String(item.value))
                                ? convertToUserTimeZone(String(item.value))
                                : String(item.value)}
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2" />
                  Коды неисправностей
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {obdData.diagnostic_trouble_code.map((code) => (
                    <li
                      key={code}
                      className="flex justify-between items-center p-2 dark:bg-[#0A0A0A] rounded border dark:border-gray-800"
                    >
                      <span className="font-semibold">{code}</span>
                      <span>
                        {dtcDescriptions[code] || 'Описание отсутствует'}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>История поездок</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="text"
                  placeholder="Поиск по имени водителя..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Водитель</TableHead>
                      <TableHead>Компания</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Страна</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.driver}</TableCell>
                        <TableCell>{trip.company}</TableCell>
                        <TableCell>{trip.phone}</TableCell>
                        <TableCell>{trip.email}</TableCell>
                        <TableCell>{trip.country}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Тех. обслуживание</CardTitle>
              </CardHeader>
              <CardContent>
                <Maintenance vehicleId={vehicleData?.vehicleId || ''} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>График данных</CardTitle>
              </CardHeader>
              <CardContent>
                <LineChart />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* Modal */}
      <Modal 
        isOpen={isModalOpen} 
        title={modalTitle} 
        onClose={closeModal}
        vehicleId={vehicleId}
      />
    </div>
  );
};

export default VehiclePage;
