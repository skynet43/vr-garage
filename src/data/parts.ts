import type { Part } from '../types';

export const parts: Part[] = [
  { id: 'pt-hg-kit', name: 'Head Gasket Set (MLS)', number: '68321311AA', system: 'Engine', engineCodes: ['EC1', 'EC3'], price: 189.99, stock: 6, location: 'A-12-03', torqueId: 'tq-head-bolts' },
  { id: 'pt-hb-set', name: 'Cylinder Head Bolt Set (TTY x10)', number: '68291563AA', system: 'Engine', engineCodes: ['EC1', 'EC3'], price: 74.5, stock: 10, location: 'A-12-04', torqueId: 'tq-head-bolts' },
  { id: 'pt-vcg', name: 'Valve Cover Gasket', number: '68245333AA', system: 'Engine', engineCodes: ['EC1', 'EC3'], price: 32.99, stock: 14, location: 'A-12-05', torqueId: 'tq-valve-cover' },
  { id: 'pt-tc-gasket', name: 'Timing Cover Gasket Set', number: '68225710AA', system: 'Engine', engineCodes: ['EC1', 'EC3'], price: 41.2, stock: 8, location: 'A-12-06', torqueId: 'tq-timing-cover' },
  { id: 'pt-tc-chain', name: 'Timing Chain Kit (chain, guides, tensioner)', number: '68312656AA', system: 'Engine', engineCodes: ['EC1', 'EC3'], price: 249.0, stock: 4, location: 'A-13-01' },
  { id: 'pt-vac-pump', name: 'Electric Vacuum Pump', number: '68442991AA', system: 'Brakes', engineCodes: ['EC1', 'EC3'], price: 315.75, stock: 3, location: 'B-02-11' },
  { id: 'pt-belt', name: 'Accessory Drive Belt', number: '68266791AA', system: 'Accessory Drive', engineCodes: ['EC1'], price: 38.4, stock: 22, location: 'B-04-02' },
  { id: 'pt-belt-et', name: 'eTorque Drive Belt', number: '68439178AA', system: 'Accessory Drive', engineCodes: ['EC3'], price: 52.9, stock: 16, location: 'B-04-03' },
  { id: 'pt-idler', name: 'Idler Pulley', number: '68226798AA', system: 'Accessory Drive', engineCodes: ['EC1', 'EC3'], price: 29.95, stock: 19, location: 'B-04-04' },
  { id: 'pt-crank-bolt', name: 'Crankshaft Pulley Bolt (one-time use)', number: '68225447AA', system: 'Engine', engineCodes: ['EC1', 'EC3'], price: 12.6, stock: 30, location: 'A-12-07', torqueId: 'tq-crank-pulley' },
  { id: 'pt-intake-g', name: 'Intake Manifold Gasket Set', number: '68235086AA', system: 'Engine', engineCodes: ['EC1', 'EC3'], price: 24.3, stock: 12, location: 'A-14-01', torqueId: 'tq-intake' },
  { id: 'pt-turbo-lines', name: 'Turbo Oil Supply + Return Line Kit', number: '68354520AA', system: 'Engine', engineCodes: ['EC1', 'EC3'], price: 118.0, stock: 5, location: 'A-14-05' },
  { id: 'pt-cam-sensor', name: 'Camshaft Position Sensor', number: '68242189AA', system: 'Electrical', engineCodes: ['EC1', 'EC3'], price: 44.85, stock: 11, location: 'C-01-08' },
  { id: 'pt-tmap', name: 'TMAP Sensor', number: '68211211AA', system: 'Electrical', engineCodes: ['EC1', 'EC3'], price: 39.5, stock: 9, location: 'C-01-09' },
  { id: 'pt-oil-filter', name: 'Oil Filter Cartridge + O-Ring', number: '68191349AC', system: 'Maintenance', engineCodes: ['EC1', 'EC3'], price: 14.2, stock: 48, location: 'D-01-01', torqueId: 'tq-oil-filter-cap' },
  { id: 'pt-spark', name: 'Spark Plug (Iridium, each)', number: 'SP978', system: 'Ignition', engineCodes: ['EC1', 'EC3'], price: 11.9, stock: 60, location: 'D-02-03', torqueId: 'tq-spark-plugs' },
  { id: 'pt-pad-f', name: 'Front Brake Pad Set', number: '68220714AA', system: 'Brakes', engineCodes: ['EC1', 'EC3'], price: 89.99, stock: 13, location: 'E-03-02' },
  { id: 'pt-rotor-f', name: 'Front Brake Rotor (each)', number: '68220720AA', system: 'Brakes', engineCodes: ['EC1', 'EC3'], price: 74.0, stock: 10, location: 'E-03-04' },
  { id: 'pt-thermostat', name: 'Thermostat + Housing', number: '68210184AA', system: 'Cooling', engineCodes: ['EC1', 'EC3'], price: 66.4, stock: 7, location: 'B-06-01' },
  { id: 'pt-water-pump', name: 'Water Pump', number: '68245815AA', system: 'Cooling', engineCodes: ['EC1', 'EC3'], price: 132.0, stock: 4, location: 'B-06-03' },
];

export const partById = (id: string) => parts.find((p) => p.id === id);
