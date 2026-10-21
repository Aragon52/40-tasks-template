import React, { useState, useEffect } from 'react';
import { PRODUCT_CATALOG } from '../data/products';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { 
  ClipboardList, 
  UserPlus, 
  ListOrdered, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Briefcase,
  Layers3,
  Sparkles,
  Award,
  Database,
  Eye,
  Info,
  Layers as LayersIcon,
  BadgeAlert,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  UserCheck
} from 'lucide-react';

export const TEMPLATE_M_1 = [
  { sr: 1, price: 498.06, profit: 1.1, title: "Dyson V8 Absolute Cordless Vacuum Cleaner with HEPA Filtration", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-8.png" },
  { sr: 2, price: 476.07, profit: 0.8, title: "Apple Watch Series 9 GPS 41mm Smartwatch with Midnight Aluminum Case", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-2.png" },
  { sr: 3, price: 500.1, profit: 1, title: "GrandPad Senior Tablet (Renewed) with Phone", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-1.png" },
  { sr: 4, price: 456.11, profit: 0.77, title: "RÉNERGIE LIFT MULTI-ACTION ULTRA FACE CREAM WITH SPF 30 1.0 Fl. Oz. (30 mL)", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-1.png" },
  { sr: 5, price: 499.12, profit: 0.69, title: "Photozyme DNA Repair Enzymes Probiotic P291", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-3.png" },
  { sr: 6, price: 486.3, profit: 0.74, title: "Sony WH-1000XM4 Wireless Noise Canceling Overhead Headphones", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-3.png" },
  { sr: 7, price: 501.66, profit: 1.01, title: "1 New ROAD CREW 11L-16 12", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-17.png" },
  { sr: 8, price: 487.12, profit: 0.89, title: "Nike Air Max 270 Sneakers Athletic Outdoor Sports Running Shoes", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-4.png" },
  { sr: 9, price: 491.9, profit: 0.88, title: "BLEU DE CHANEL Eau de Parfum Spray for Men 3.4 Fl. Oz.", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-6.png" },
  { sr: 10, price: 503.65, profit: 1.4, title: "Walker Products 350-64080 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-18.png" },
  { sr: 11, price: 503.44, profit: 0.8, title: "Walker Products 350-34643 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-19.png" },
  { sr: 12, price: 489.87, profit: 0.76, title: "Stanley Quencher H2.0 FlowState Tumbler 40oz Vacuum Insulated Mug", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-5.png" },
  { sr: 13, price: 504, profit: 1.1, title: "Tommy Hilfiger Men’s Oxford Ribb Stripe", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-5.png" },
  { sr: 14, price: 495.65, profit: 0.86, title: "L'Oreal Paris Revitalift Pure Hyaluronic Acid Face Serum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-7.png" },
  { sr: 15, price: 673.8, profit: 68, title: "AUTOGEN 12V & 24V Jump Starter", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-7.png" },
  { sr: 16, price: 733.8, profit: 1.2, title: "Inteset 12ft 40amp J1772 EV Extension", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-20.png" },
  { sr: 17, price: 731.7, profit: 1, title: "Touch Screen Android Head Unit for", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-14.png" },
  { sr: 18, price: 729.5, profit: 1.43, title: "Scales Of Justice Blue Navy Blue", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-6.png" },
  { sr: 19, price: 721.6, profit: 1.21, title: "Autel Maxisys CV MS908CV", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-8.png" },
  { sr: 20, price: 730.4, profit: 1.2, title: "CARTMAN 3 Pack Warning Triangle DOT", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-12.png" },
  { sr: 21, price: 727.9, profit: 1.1, title: "Garmin DriveSmart 86", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-11.png" },
  { sr: 22, price: 739.3, profit: 1.8, title: "Walker Products 350-34652 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-21.png" },
  { sr: 23, price: 733.9, profit: 1.3, title: "Tyrell Chenergy 1800/900 Peak Amp 12V/24V", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-9.png" },
  { sr: 24, price: 721.4, profit: 1.1, title: "Woeoe Thick Warm Winter Hat Yellow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-2.png" },
  { sr: 25, price: 734.2, profit: 1.3, title: "ProFormX Velocity 14 Golf Cart Wheels", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-15.png" },
  { sr: 26, price: 740.4, profit: 1.5, title: "NOCO Boost HD GB70 2000 Amp", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-10.png" },
  { sr: 27, price: 749.6, profit: 1.6, title: "Schumacher DSR115 DSR ProSeries Rechargeable Pro", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-13.png" },
  { sr: 28, price: 1036.54, profit: 97, title: "Walker Products 350-64081 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-25.png" },
  { sr: 29, price: 1121.54, profit: 1.7, title: "Women's Sports Mom Embroidered Ladies Fit", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-29.png" },
  { sr: 30, price: 1123.56, profit: 1.6, title: "Ted Baker Alacon Plain Bow Large", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-36.png" },
  { sr: 31, price: 999.78, profit: 1, title: "Rebecca Taylor Women’s Rib Knit Cardi", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-32.png" },
  { sr: 32, price: 1002.4, profit: 1.1, title: "Mob Armor Mob Mount Switch Magnetic", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-16.png" },
  { sr: 33, price: 1123.4, profit: 1.5, title: "Walker Products 350-34095 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-22.png" },
  { sr: 34, price: 1110.5, profit: 1.4, title: "2PCS Car Door Edge Entry Guard", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-27.png" },
  { sr: 35, price: 1123.76, profit: 1.3, title: "Pampers Pure Protection Diapers Size 6", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-33.png" },
  { sr: 36, price: 1137.66, profit: 1.4, title: "Walker Products 350-34639 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-26.png" },
  { sr: 37, price: 1138.99, profit: 1.5, title: "Elfeves Lot 4 PCS Classic Men’s", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-4.png" },
  { sr: 38, price: 1136.86, profit: 1.4, title: "3.1 Phillip Lim Saddle Bag", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-34.png" },
  { sr: 39, price: 1144.79, profit: 1.3, title: "Ted Baker Womens Knot Bow Icon", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-37.png" },
  { sr: 40, price: 1147.74, profit: 1.9, title: "Ted Baker Women Plain Bow Icon", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-38.png" }
];

export const TEMPLATE_C_1 = [
  { sr: 1, price: 21.01, profit: 0.07, title: "1 New ROAD CREW 11L-16 12", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-17.png" },
  { sr: 2, price: 20.12, profit: 0.06, title: "Stanley Quencher H2.0 FlowState Tumbler 40oz Vacuum Insulated Mug", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-5.png" },
  { sr: 3, price: 19.45, profit: 0.04, title: "Apple Watch Series 9 GPS 41mm Smartwatch with Midnight Aluminum Case", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-2.png" },
  { sr: 4, price: 20.11, profit: 0.07, title: "Nike Air Max 270 Sneakers Athletic Outdoor Sports Running Shoes", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-4.png" },
  { sr: 5, price: 20.43, profit: 0.06, title: "BLEU DE CHANEL Eau de Parfum Spray for Men 3.4 Fl. Oz.", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-6.png" },
  { sr: 6, price: 20.56, profit: 0.05, title: "L'Oreal Paris Revitalift Pure Hyaluronic Acid Face Serum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-7.png" },
  { sr: 7, price: 20.88, profit: 0.08, title: "Photozyme DNA Repair Enzymes Probiotic P291", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-3.png" },
  { sr: 8, price: 20.94, profit: 0.07, title: "GrandPad Senior Tablet (Renewed) with Phone", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-1.png" },
  { sr: 9, price: 21.12, profit: 0.08, title: "Walker Products 350-64080 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-18.png" },
  { sr: 10, price: 19.88, profit: 0.06, title: "Sony WH-1000XM4 Wireless Noise Canceling Overhead Headphones", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-3.png" },
  { sr: 11, price: 18.98, profit: 0.05, title: "RÉNERGIE LIFT MULTI-ACTION ULTRA FACE CREAM WITH SPF 30 1.0 Fl. Oz. (30 mL)", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-1.png" },
  { sr: 12, price: 20.77, profit: 0.09, title: "Dyson V8 Absolute Cordless Vacuum Cleaner with HEPA Filtration", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-8.png" },
  { sr: 13, price: 19.45, profit: 0.08, title: "Apple Watch Series 9 GPS 41mm Smartwatch with Midnight Aluminum Case", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-2.png" },
  { sr: 14, price: 20.77, profit: 0.07, title: "Dyson V8 Absolute Cordless Vacuum Cleaner with HEPA Filtration", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-8.png" },
  { sr: 15, price: 21.21, profit: 0.07, title: "Tommy Hilfiger Men’s Oxford Ribb Stripe", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-5.png" },
  { sr: 16, price: 21.11, profit: 0.06, title: "Walker Products 350-34643 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-19.png" },
  { sr: 17, price: 20.56, profit: 0.05, title: "L'Oreal Paris Revitalift Pure Hyaluronic Acid Face Serum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-7.png" },
  { sr: 18, price: 20.88, profit: 0.08, title: "Photozyme DNA Repair Enzymes Probiotic P291", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-3.png" },
  { sr: 19, price: 20.94, profit: 0.07, title: "GrandPad Senior Tablet (Renewed) with Phone", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-1.png" },
  { sr: 20, price: 21.12, profit: 0.08, title: "Walker Products 350-64080 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-18.png" },
  { sr: 21, price: 19.88, profit: 0.06, title: "Sony WH-1000XM4 Wireless Noise Canceling Overhead Headphones", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-3.png" },
  { sr: 22, price: 19.88, profit: 0.06, title: "Sony WH-1000XM4 Wireless Noise Canceling Overhead Headphones", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-3.png" },
  { sr: 23, price: 18.98, profit: 0.05, title: "RÉNERGIE LIFT MULTI-ACTION ULTRA FACE CREAM WITH SPF 30 1.0 Fl. Oz. (30 mL)", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-1.png" },
  { sr: 24, price: 20.77, profit: 0.09, title: "Dyson V8 Absolute Cordless Vacuum Cleaner with HEPA Filtration", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-8.png" },
  { sr: 25, price: 19.45, profit: 0.08, title: "Apple Watch Series 9 GPS 41mm Smartwatch with Midnight Aluminum Case", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-2.png" },
  { sr: 26, price: 20.77, profit: 0.07, title: "Dyson V8 Absolute Cordless Vacuum Cleaner with HEPA Filtration", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-8.png" },
  { sr: 27, price: 21.21, profit: 0.07, title: "Tommy Hilfiger Men’s Oxford Ribb Stripe", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-5.png" },
  { sr: 28, price: 21.11, profit: 0.06, title: "Walker Products 350-34643 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-19.png" },
  { sr: 29, price: 20.56, profit: 0.05, title: "L'Oreal Paris Revitalift Pure Hyaluronic Acid Face Serum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-7.png" },
  { sr: 30, price: 20.88, profit: 0.08, title: "Photozyme DNA Repair Enzymes Probiotic P291", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-3.png" },
  { sr: 31, price: 20.94, profit: 0.07, title: "GrandPad Senior Tablet (Renewed) with Phone", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-1.png" },
  { sr: 32, price: 21.12, profit: 0.08, title: "Walker Products 350-64080 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-18.png" },
  { sr: 33, price: 19.88, profit: 0.06, title: "Sony WH-1000XM4 Wireless Noise Canceling Overhead Headphones", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-3.png" },
  { sr: 34, price: 19.88, profit: 0.06, title: "Sony WH-1000XM4 Wireless Noise Canceling Overhead Headphones", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-3.png" },
  { sr: 35, price: 18.98, profit: 0.05, title: "RÉNERGIE LIFT MULTI-ACTION ULTRA FACE CREAM WITH SPF 30 1.0 Fl. Oz. (30 mL)", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-1.png" },
  { sr: 36, price: 20.77, profit: 0.09, title: "Dyson V8 Absolute Cordless Vacuum Cleaner with HEPA Filtration", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-8.png" },
  { sr: 37, price: 20.94, profit: 0.07, title: "GrandPad Senior Tablet (Renewed) with Phone", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-1.png" },
  { sr: 38, price: 21.12, profit: 0.08, title: "Walker Products 350-64080 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-18.png" },
  { sr: 39, price: 19.88, profit: 0.06, title: "Sony WH-1000XM4 Wireless Noise Canceling Overhead Headphones", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-3.png" },
  { sr: 40, price: 19.88, profit: 0.06, title: "Sony WH-1000XM4 Wireless Noise Canceling Overhead Headphones", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/prod-3.png" }
];

export const TEMPLATE_C_2 = [
  { sr: 1, price: 40.2, profit: 0.12, title: "AUTOGEN 12V & 24V Jump Starter", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-7.png" },
  { sr: 2, price: 43.8, profit: 0.11, title: "Woeoe Thick Warm Winter Hat Yellow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-2.png" },
  { sr: 3, price: 46.8, profit: 0.15, title: "Garmin DriveSmart 86", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-11.png" },
  { sr: 4, price: 43.8, profit: 0.11, title: "Woeoe Thick Warm Winter Hat Yellow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-2.png" },
  { sr: 5, price: 47.8, profit: 0.14, title: "Scales Of Justice Blue Navy Blue", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-6.png" },
  { sr: 6, price: 40.2, profit: 0.27, title: "AUTOGEN 12V & 24V Jump Starter", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-7.png" },
  { sr: 7, price: 43.8, profit: 0.11, title: "Woeoe Thick Warm Winter Hat Yellow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-2.png" },
  { sr: 8, price: 47.8, profit: 0.28, title: "Scales Of Justice Blue Navy Blue", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-6.png" },
  { sr: 9, price: 43.8, profit: 0.11, title: "Woeoe Thick Warm Winter Hat Yellow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-2.png" },
  { sr: 10, price: 46.8, profit: 0.15, title: "Garmin DriveSmart 86", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-11.png" },
  { sr: 11, price: 47.8, profit: 0.14, title: "Scales Of Justice Blue Navy Blue", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-6.png" },
  { sr: 12, price: 43.8, profit: 0.11, title: "Woeoe Thick Warm Winter Hat Yellow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-2.png" },
  { sr: 13, price: 45.9, profit: 0.14, title: "Autel Maxisys CV MS908CV", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-8.png" },
  { sr: 14, price: 43.8, profit: 0.11, title: "Woeoe Thick Warm Winter Hat Yellow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-2.png" },
  { sr: 15, price: 47.8, profit: 0.14, title: "Scales Of Justice Blue Navy Blue", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-6.png" },
  { sr: 16, price: 81.87, profit: 14, title: "CARTMAN 3 Pack Warning Triangle DOT", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-12.png" },
  { sr: 17, price: 94.11, profit: 0.23, title: "Walker Products 350-34652 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-21.png" },
  { sr: 18, price: 93.24, profit: 0.22, title: "ProFormX Velocity 14 Golf Cart Wheels", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-15.png" },
  { sr: 19, price: 91.88, profit: 0.2, title: "Touch Screen Android Head Unit for", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-14.png" },
  { sr: 20, price: 94.99, profit: 0.3, title: "NOCO Boost HD GB70 2000 Amp", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-10.png" },
  { sr: 21, price: 91.96, profit: 0.19, title: "Inteset 12ft 40amp J1772 EV Extension", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-20.png" },
  { sr: 22, price: 91.88, profit: 0.2, title: "Touch Screen Android Head Unit for", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-14.png" },
  { sr: 23, price: 94.99, profit: 0.3, title: "NOCO Boost HD GB70 2000 Amp", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-10.png" },
  { sr: 24, price: 92.66, profit: 0.19, title: "Tyrell Chenergy 1800/900 Peak Amp 12V/24V", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-9.png" },
  { sr: 25, price: 94.11, profit: 0.23, title: "Walker Products 350-34652 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-21.png" },
  { sr: 26, price: 93.24, profit: 0.22, title: "ProFormX Velocity 14 Golf Cart Wheels", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-15.png" },
  { sr: 27, price: 91.88, profit: 0.2, title: "Touch Screen Android Head Unit for", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-14.png" },
  { sr: 28, price: 94.99, profit: 0.3, title: "NOCO Boost HD GB70 2000 Amp", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-10.png" },
  { sr: 29, price: 97.01, profit: 0.34, title: "Schumacher DSR115 DSR ProSeries Rechargeable Pro", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-13.png" },
  { sr: 30, price: 161.99, profit: 26, title: "Rebecca Taylor Women’s Rib Knit Cardi", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-32.png" },
  { sr: 31, price: 180.55, profit: 0.5, title: "Women's Sports Mom Embroidered Ladies Fit", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-29.png" },
  { sr: 32, price: 187.01, profit: 0.6, title: "Pampers Pure Protection Diapers Size 6", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-33.png" },
  { sr: 33, price: 164.88, profit: 0.4, title: "Mob Armor Mob Mount Switch Magnetic", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-16.png" },
  { sr: 34, price: 183.99, profit: 0.4, title: "Walker Products 350-34095 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-22.png" },
  { sr: 35, price: 186.96, profit: 0.4, title: "Ted Baker Alacon Plain Bow Large", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-36.png" },
  { sr: 36, price: 171.8, profit: 0.3, title: "Walker Products 350-64081 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-25.png" },
  { sr: 37, price: 177.9, profit: 0.3, title: "2PCS Car Door Edge Entry Guard", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-27.png" },
  { sr: 38, price: 180.55, profit: 0.5, title: "Women's Sports Mom Embroidered Ladies Fit", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-29.png" },
  { sr: 39, price: 187.01, profit: 0.6, title: "Pampers Pure Protection Diapers Size 6", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-33.png" },
  { sr: 40, price: 164.88, profit: 0.4, title: "Mob Armor Mob Mount Switch Magnetic", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-16.png" }
];

export const TEMPLATE_C_3 = [
  { sr: 1, price: 460.44, profit: 4.6, title: "ELEMIS Pro-Collagen Marine Cream | Lightweight", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-49.png" },
  { sr: 2, price: 421.88, profit: 4.3, title: "Proactiv Acne Cleanser - Benzoyl Peroxide", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-45.png" },
  { sr: 3, price: 450.99, profit: 5.1, title: "Farmonics Ubtan Natural Face Wash with", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-46.png" },
  { sr: 4, price: 460.66, profit: 6.4, title: "BOSS Men’s Authentic Pants", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-50.png" },
  { sr: 5, price: 433.74, profit: 5.5, title: "NovoGlow No.1 Paris for Women -", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-31.png" },
  { sr: 6, price: 421.88, profit: 5.9, title: "Proactiv Acne Cleanser - Benzoyl Peroxide", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cj-45.png" },
  { sr: 7, price: 441.77, profit: 5.8, title: "Lacoste Men’s Sport Fleece Joggernon Deal", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-52.png" },
  { sr: 8, price: 460.44, profit: 4.9, title: "ELEMIS Pro-Collagen Marine Cream | Lightweight", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-49.png" },
  { sr: 9, price: 433.93, profit: 5, title: "Gen3 Marine Centric Folding Boat Seat", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-47.png" },
  { sr: 10, price: 460.66, profit: 6.4, title: "BOSS Men’s Authentic Pants", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-50.png" },
  { sr: 11, price: 499.65, profit: 7.9, title: "PIOJNYEN 26.5 Lbs Rice Dispenser Large", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-56.png" },
  { sr: 12, price: 510.88, profit: 13.6, title: "Eyeshadow Palette with Mirror", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-41.png" },
  { sr: 13, price: 769.84, profit: 129.66, title: "Lacoste Men’s Bold Graphic Jogger Sweatpant", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-61.png" },
  { sr: 14, price: 890.77, profit: 20.1, title: "Rebecca Taylor Women’s Long Sleeve Animal", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-137.png" },
  { sr: 15, price: 888.54, profit: 20, title: "Byinns Womens Square Neck Sleeveless Ruffle", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-136.png" },
  { sr: 16, price: 920.77, profit: 25.95, title: "Rebecca Taylor Women’s Violet Fleur Belted", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-148.png" },
  { sr: 17, price: 930.11, profit: 30.46, title: "Rebecca Taylor Women’s Ruched Scoop Neck", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-150.png" },
  { sr: 18, price: 920.66, profit: 40.44, title: "Rebecca Taylor Womens Floral Print Ruffled", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-145.png" },
  { sr: 19, price: 1010.87, profit: 50.66, title: "Rebecca Taylor Women’s Delft Fleur Belted", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-147.png" },
  { sr: 20, price: 908.99, profit: 40.55, title: "Rebecca Taylor Women’s Short Sleeve Lurex", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-140.png" },
  { sr: 21, price: 1100.93, profit: 60.55, title: "MAGE MALE Mens Suits Dress Floral", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-134.png" },
  { sr: 22, price: 1179.66, profit: 50.94, title: "Rebecca Taylor Women’s Heavy Cotton Shirt", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-161.png" },
  { sr: 23, price: 1211.55, profit: 60.41, title: "Rebecca Taylor Women’s Long Sleeve Shadow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-160.png" },
  { sr: 24, price: 1289.51, profit: 70.65, title: "Rebecca Taylor Women’s Ramie Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-156.png" },
  { sr: 25, price: 1236.88, profit: 60.79, title: "Rebecca Taylor Women’s Sleeveless Bromstick Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-162.png" },
  { sr: 26, price: 2232.87, profit: 397.65, title: "Upward Fit 20 Pack Bulk Yoga", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-179.png" },
  { sr: 27, price: 2601.88, profit: 120.99, title: "Xgody 2 in 1 Tablet 10.1", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-172.png" },
  { sr: 28, price: 2507.54, profit: 110.92, title: "Clutch Purse Evening Shoulder Pleated Bag", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-177.png" },
  { sr: 29, price: 2799.84, profit: 140.9, title: "Fullgaden Exercise Ball (55-75cm) with Quick", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-178.png" },
  { sr: 30, price: 2675.8, profit: 130.8, title: "Manduka eQua Yoga Mat Towel -", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-186.png" },
  { sr: 31, price: 3100.66, profit: 167.25, title: "Yoga Towel - Tie-Die Textures Non-Slip", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-185.png" },
  { sr: 32, price: 4826.26, profit: 867.31, title: "Christian Dior Jadore By Christian Dior", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-201.png" },
  { sr: 33, price: 5550.59, profit: 280.88, title: "Givenchy L’interdit Women", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-204.png" },
  { sr: 34, price: 5498.77, profit: 263.22, title: "GIORGIO ARMANI - Armani Code Eau", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-203.png" },
  { sr: 35, price: 6100.69, profit: 300.6, title: "CHRISTIAN DIOR J’Adore Women Eau De", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-206.png" },
  { sr: 36, price: 5900.51, profit: 400.6, title: "Sukeen Cooling Towel for Neck and", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-190.png" },
  { sr: 37, price: 5821.63, profit: 398.22, title: "Mongoose Fireball Dirt Jump Mens and", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-195.png" },
  { sr: 38, price: 6590.61, profit: 502.91, title: "Dolce & Gabbana The Only One", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-202.png" },
  { sr: 39, price: 11226.39, profit: 1567.31, title: "Schwinn Bonafide Men and Women Mountain", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-194.png" },
  { sr: 40, price: 18791.11, profit: 2852.77, title: "Lattafa Perfumes Asad for Unisex Eau", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-210.png" }
];

export const TEMPLATE_C_4 = [
  { sr: 1, price: 378.98, profit: 3.22, title: "Ted Baker Womens Knot Bow Icon", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-37.png" },
  { sr: 2, price: 390.22, profit: 4.1, title: "Four 32x10-14 Tusk TERRABITE Heavy Duty", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-28.png" },
  { sr: 3, price: 370.35, profit: 3.7, title: "Elfeves Lot 4 PCS Classic Men’s", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-4.png" },
  { sr: 4, price: 380.43, profit: 3.8, title: "Ted Baker Women Plain Bow Icon", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-38.png" },
  { sr: 5, price: 390.11, profit: 4, title: "4PCS Women Fashion Handbags Purses Wallet", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-35.png" },
  { sr: 6, price: 360.43, profit: 3.1, title: "3.1 Phillip Lim Saddle Bag", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-34.png" },
  { sr: 7, price: 388.55, profit: 3.8, title: "Heavy-Duty 180° Adjustable 2.0 Tubular Clamp", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-24.png" },
  { sr: 8, price: 367.98, profit: 3.2, title: "Walker Products 350-34639 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-26.png" },
  { sr: 9, price: 386.43, profit: 4.1, title: "Carolina Herrera Good Girl Eau de", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-30.png" },
  { sr: 10, price: 387.99, profit: 4.2, title: "By Kilian - Black Phantom -", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-39.png" },
  { sr: 11, price: 360.43, profit: 3.1, title: "3.1 Phillip Lim Saddle Bag", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-34.png" },
  { sr: 12, price: 400.08, profit: 4.5, title: "Walker Products 350-64022 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-23.png" },
  { sr: 13, price: 693.66, profit: 112.47, title: "Lacoste Men’s Sport Brushed Fleece Pant", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-54.png" },
  { sr: 14, price: 799.54, profit: 19.45, title: "Alex Evenings Women’s A-line Lace Evening", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-129.png" },
  { sr: 15, price: 786.99, profit: 18.55, title: "Essence Mascara Lash Princess", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-40.png" },
  { sr: 16, price: 800.1, profit: 23.22, title: "Rebecca Taylor Women’s Marseille Stripe Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-143.png" },
  { sr: 17, price: 765.54, profit: 17.88, title: "Lacoste Men’s Regular Fit Tournament Sport", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-55.png" },
  { sr: 18, price: 799.99, profit: 20.11, title: "FARYSAYS Summer Dresses for Women Sleeveless", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-141.png" },
  { sr: 19, price: 803.48, profit: 21.22, title: "HAOMEILI Women’s Summer Dress Deep V", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-135.png" },
  { sr: 20, price: 806.39, profit: 22, title: "Ted Baker Cillaah Ponte Bodice Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-133.png" },
  { sr: 21, price: 785.97, profit: 19.33, title: "PAIGE Women’s Cindy Maternity Jeans", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-58.png" },
  { sr: 22, price: 921.88, profit: 30.46, title: "Rebecca Taylor Women’s Sleeveless Stripe Wrap", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-149.png" },
  { sr: 23, price: 867.99, profit: 25.47, title: "Adrianna Papell Women’s Metallic Jacquard Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-130.png" },
  { sr: 24, price: 856.5, profit: 24.5, title: "Rebecca Taylor Women’s Cupro Shirt Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-144.png" },
  { sr: 25, price: 898.06, profit: 24.55, title: "Rebecca Taylor Women’s Short Sleeve Dot", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-138.png" },
  { sr: 26, price: 1610.75, profit: 286.93, title: "siliteelon Women High Waist Casual Wide", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-158.png" },
  { sr: 27, price: 1856.44, profit: 50.44, title: "45W USB C Super Fast Charger", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-169.png" },
  { sr: 28, price: 1877.99, profit: 49.44, title: "Rebecca Taylor Women’s Long Sleeve V-Neck", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-157.png" },
  { sr: 29, price: 1930.44, profit: 52.79, title: "ACR ResQLink View - Buoyant Personal", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-170.png" },
  { sr: 30, price: 1899.86, profit: 49.65, title: "Google Pixel 6 Pro - 5G", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-175.png" },
  { sr: 31, price: 2008.55, profit: 62.44, title: "VEVOR Retractable Extension Cord Reel 65", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-171.png" },
  { sr: 32, price: 3445.90, profit: 589.44, title: "NUTSAAKK Yoga Mat Holder Wall Mount", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-181.png" },
  { sr: 33, price: 3997.99, profit: 70.45, title: "Rebecca Taylor Women’s Sleeveless Scarlet Wrap", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-165.png" },
  { sr: 34, price: 4001.33, profit: 80.23, title: "PRUKIVRA Non Slip Yoga Towel with", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-188.png" },
  { sr: 35, price: 3879.66, profit: 77.56, title: "iJoy Headphones Wireless Bluetooth- Wireless Sports", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-183.png" },
  { sr: 36, price: 4111.43, profit: 81.44, title: "Crostice Bike Mat Compatible with Peloton", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-189.png" },
  { sr: 37, price: 3999.99, profit: 79.7, title: "Nisorpa Yoga Auxiliary Foldable Chair with", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-182.png" },
  { sr: 38, price: 4324.44, profit: 85.45, title: "Huffy Stone Mountain Bike", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-193.png" },
  { sr: 39, price: 7374.72, profit: 1482.39, title: "KHADLAJ PERFUMES Hareem Al Sultan Concentrated", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-205.png" },
  { sr: 40, price: 14384.93, profit: 2914.53, title: "Marc Jacobs Daisy Dream Eau de", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-209.png" }
];

export const TEMPLATE_C_5 = [
  { sr: 1, price: 750.55, profit: 6.44, title: "Powder Canister", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-42.png" },
  { sr: 2, price: 711.76, profit: 6.9, title: "Lacoste Men’s Sport Tennis Shorts", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-51.png" },
  { sr: 3, price: 743.77, profit: 7.9, title: "PAIGE Women’s Allure Short Raw Hem", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-59.png" },
  { sr: 4, price: 769.33, profit: 7.43, title: "TrumKiFier RC Boat for Kids", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-48.png" },
  { sr: 5, price: 721.77, profit: 6.9, title: "Red Nail Polish", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-44.png" },
  { sr: 6, price: 777.81, profit: 8, title: "Red Lipstick", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-43.png" },
  { sr: 7, price: 801.22, profit: 9.5, title: "Rebecca Taylor Women’s Smocked Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-139.png" },
  { sr: 8, price: 799.43, profit: 8.3, title: "PAIGE womens Carly Jumpsuit Short Sleeve", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-132.png" },
  { sr: 9, price: 800.3, profit: 8.6, title: "Rebecca Taylor Women’s Labyrinth Slip Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-146.png" },
  { sr: 10, price: 751.7, profit: 7.4, title: "Mizuno Prospect Softball Pant", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-57.png" },
  { sr: 11, price: 811.7, profit: 9.1, title: "Janasya Women’s Mustard Foil Printed Poly", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-128.png" },
  { sr: 12, price: 729.11, profit: 6.4, title: "Lacoste Men’s Slim Fit Stretch Denim", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-53.png" },
  { sr: 13, price: 831.55, profit: 10.2, title: "Lacoste Women’s Short Sleeve Slim Fit", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-142.png" },
  { sr: 14, price: 791.54, profit: 7.8, title: "Lacoste Mens Sport Tennis Fleece Short", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-60.png" },
  { sr: 15, price: 870.33, profit: 11.5, title: "Adrianna Papell Stretch Crepe Jumpsuit with", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-131.png" },
  { sr: 16, price: 1329.64, profit: 256.1, title: "Rebecca Taylor womens Check Romper", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-155.png" },
  { sr: 17, price: 1500.22, profit: 56.87, title: "Rebecca Taylor Women’s Agnes Embroidery Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-152.png" },
  { sr: 18, price: 1600.34, profit: 60.4, title: "YUAKOU Women’s Tulle Petticoat Crinoline Half", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-154.png" },
  { sr: 19, price: 1476.65, profit: 40.5, title: "Rebecca Taylor Women’s Godet Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-159.png" },
  { sr: 20, price: 1621.87, profit: 50.6, title: "Adrianna Papell Women’s Metallic Knit Draped", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-166.png" },
  { sr: 21, price: 1438.91, profit: 39.4, title: "MSemis Woman Sexy Mesh Sheer Transparent", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-153.png" },
  { sr: 22, price: 1830.43, profit: 70.52, title: "Rebecca Taylor Women’s Sleeveless V-Neck Tweed", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-168.png" },
  { sr: 23, price: 1654.98, profit: 50.22, title: "Rebecca Taylor Women’s Daphne Fleur Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-151.png" },
  { sr: 24, price: 1794.88, profit: 60.12, title: "Adrianna Papell Women’s Beaded Short Cocktail", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-167.png" },
  { sr: 25, price: 1887.53, profit: 70.33, title: "Rebecca Taylor Women’s Long Sleeve Star", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-164.png" },
  { sr: 26, price: 1997.55, profit: 90.5, title: "Lenovo Tab P11 (2nd Gen) -", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-173.png" },
  { sr: 27, price: 1876.87, profit: 76.9, title: "Rebecca Taylor Women’s Long Sleeve Perla", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-163.png" },
  { sr: 28, price: 2100.63, profit: 100.57, title: "SAMSUNG Galaxy Z Flip 5 Cell", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-174.png" },
  { sr: 29, price: 3591.55, profit: 605.32, title: "FrenzyBird 6’x4’ Large Yoga Mat ¼”", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-180.png" },
  { sr: 30, price: 4111.34, profit: 200.67, title: "PS Squat Exercise Row Machine", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-184.png" },
  { sr: 31, price: 3999.76, profit: 197.55, title: "Satechi 100W USB C PD Compact", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-176.png" },
  { sr: 32, price: 4288.56, profit: 230.91, title: "Eunzel Yoga Towel", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-187.png" },
  { sr: 33, price: 7498.91, profit: 1299.99, title: "Schwinn Protocol 1.0 Mens and Womens", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-196.png" },
  { sr: 34, price: 8722.23, profit: 362.66, title: "Schwinn Boundary Mountain Bike", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-197.png" },
  { sr: 35, price: 8112.98, profit: 310.55, title: "Giorgio Armani Si Eau de Parfum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-207.png" },
  { sr: 36, price: 9200.56, profit: 450.57, title: "5 Pack Cooling Towel", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-191.png" },
  { sr: 37, price: 9771.84, profit: 560.44, title: "ALLURE WOMEN C H A N", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-198.png" },
  { sr: 38, price: 8176.93, profit: 432.98, title: "Daisy By Marc Jacobs for Women", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-199.png" },
  { sr: 39, price: 16558.88, profit: 2912.93, title: "KEAFOLS Cooling Towel Neck Wrap", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-192.png" },
  { sr: 40, price: 30718.57, profit: 5927.51, title: "Rihanna Riri Eau De Parfum Spray", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-200.png" }
];

export const TEMPLATE_M_2 = [
  { sr: 1, price: 1936.33, profit: 2.1, title: "Walker Products 350-64022 Oxygen Sensor", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-23.png" },
  { sr: 2, price: 1999.64, profit: 1.98, title: "ELEMIS Pro-Collagen Marine Cream | Lightweight", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-49.png" },
  { sr: 3, price: 1821.75, profit: 1.77, title: "By Kilian - Black Phantom -", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-39.png" },
  { sr: 4, price: 2001.55, profit: 2, title: "BOSS Men’s Authentic Pants", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-50.png" },
  { sr: 5, price: 1721.9, profit: 1.88, title: "Carolina Herrera Good Girl Eau de", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-30.png" },
  { sr: 6, price: 1856.41, profit: 1.96, title: "4PCS Women Fashion Handbags Purses Wallet", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-35.png" },
  { sr: 7, price: 1998.58, profit: 2.2, title: "Farmonics Ubtan Natural Face Wash with", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-46.png" },
  { sr: 8, price: 1962.95, profit: 2.1, title: "Gen3 Marine Centric Folding Boat Seat", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-47.png" },
  { sr: 9, price: 2016.01, profit: 2.3, title: "Lacoste Men’s Sport Brushed Fleece Pant", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-54.png" },
  { sr: 10, price: 2001.99, profit: 2, title: "PIOJNYEN 26.5 Lbs Rice Dispenser Large", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-56.png" },
  { sr: 11, price: 1995.8, profit: 1.88, title: "Lacoste Men’s Sport Fleece Joggernon Deal", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-52.png" },
  { sr: 12, price: 1953.48, profit: 1.7, title: "NovoGlow No.1 Paris for Women -", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-31.png" },
  { sr: 13, price: 2010.42, profit: 1.8, title: "Eyeshadow Palette with Mirror", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-41.png" },
  { sr: 14, price: 1889.53, profit: 1.6, title: "Four 32x10-14 Tusk TERRABITE Heavy Duty", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-28.png" },
  { sr: 15, price: 1946.99, profit: 1.99, title: "Proactiv Acne Cleanser - Benzoyl Peroxide", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-45.png" },
  { sr: 16, price: 1826.79, profit: 1.98, title: "Heavy-Duty 180° Adjustable 2.0 Tubular Clamp", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-24.png" },
  { sr: 17, price: 2030.9, profit: 2.4, title: "Lacoste Men’s Sport Tennis Shorts", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-51.png" },
  { sr: 18, price: 2335.64, profit: 112, title: "Lacoste Men’s Slim Fit Stretch Denim", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-53.png" },
  { sr: 19, price: 2412.7, profit: 5.6, title: "PAIGE Women’s Cindy Maternity Jeans", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-58.png" },
  { sr: 20, price: 2411.6, profit: 5.1, title: "Red Lipstick", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-43.png" },
  { sr: 21, price: 2315.5, profit: 4.9, title: "Red Nail Polish", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-44.png" },
  { sr: 22, price: 2409.88, profit: 5.6, title: "Lacoste Men’s Bold Graphic Jogger Sweatpant", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-61.png" },
  { sr: 23, price: 2367.9, profit: 4.7, title: "PAIGE Women’s Allure Short Raw Hem", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-59.png" },
  { sr: 24, price: 2386.9, profit: 4.9, title: "Lacoste Men’s Regular Fit Tournament Sport", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-55.png" },
  { sr: 25, price: 2399.5, profit: 5.3, title: "TrumKiFier RC Boat for Kids", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-48.png" },
  { sr: 26, price: 2480.7, profit: 5.9, title: "Essence Mascara Lash Princess", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-40.png" },
  { sr: 27, price: 2370.9, profit: 4.6, title: "Powder Canister", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-42.png" },
  { sr: 28, price: 2383.8, profit: 4.8, title: "Mizuno Prospect Softball Pant", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-57.png" },
  { sr: 29, price: 3091.04, profit: 238, title: "Lacoste Mens Sport Tennis Fleece Short", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-60.png" },
  { sr: 30, price: 3322.9, profit: 6, title: "Janasya Women’s Mustard Foil Printed Poly", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-128.png" },
  { sr: 31, price: 3212, profit: 5.1, title: "FARYSAYS Summer Dresses for Women Sleeveless", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-141.png" },
  { sr: 32, price: 3169.8, profit: 4.9, title: "Alex Evenings Women’s A-line Lace Evening", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-129.png" },
  { sr: 33, price: 3274.9, profit: 5.7, title: "Rebecca Taylor Women’s Smocked Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-139.png" },
  { sr: 34, price: 3311.8, profit: 5.4, title: "HAOMEILI Women’s Summer Dress Deep V", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-135.png" },
  { sr: 35, price: 3258.9, profit: 5.1, title: "Rebecca Taylor Women’s Labyrinth Slip Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-146.png" },
  { sr: 36, price: 3311.8, profit: 6, title: "HAOMEILI Women’s Summer Dress Deep V", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-135.png" },
  { sr: 37, price: 3313.8, profit: 6, title: "Ted Baker Cillaah Ponte Bodice Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-133.png" },
  { sr: 38, price: 3126.7, profit: 5.1, title: "PAIGE womens Carly Jumpsuit Short Sleeve", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-132.png" },
  { sr: 39, price: 3217.6, profit: 6.1, title: "Rebecca Taylor Women’s Marseille Stripe Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-143.png" },
  { sr: 40, price: 3380.7, profit: 6.4, title: "Lacoste Women’s Short Sleeve Slim Fit", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-142.png" }
];

export const TEMPLATE_M_3 = [
  { sr: 1, price: 5997.87, profit: 29.5, title: "Rebecca Taylor Women’s Heavy Cotton Shirt", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-161.png" },
  { sr: 2, price: 5624, profit: 28.7, title: "Byinns Womens Square Neck Sleeveless Ruffle", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-136.png" },
  { sr: 3, price: 5999.89, profit: 30.1, title: "Rebecca Taylor Women’s Ramie Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-156.png" },
  { sr: 4, price: 5267.8, profit: 26, title: "Adrianna Papell Women’s Metallic Jacquard Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-130.png" },
  { sr: 5, price: 5742.99, profit: 31, title: "Rebecca Taylor Women’s Long Sleeve Animal", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-137.png" },
  { sr: 6, price: 5822.77, profit: 29.85, title: "Rebecca Taylor Women’s Short Sleeve Lurex", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-140.png" },
  { sr: 7, price: 5986.83, profit: 30.11, title: "Rebecca Taylor Women’s Delft Fleur Belted", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-147.png" },
  { sr: 8, price: 5542.5, profit: 26.6, title: "Adrianna Papell Stretch Crepe Jumpsuit with", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-131.png" },
  { sr: 9, price: 5846.61, profit: 27, title: "Rebecca Taylor Womens Floral Print Ruffled", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-145.png" },
  { sr: 10, price: 5999.89, profit: 30.1, title: "Rebecca Taylor Women’s Ramie Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-156.png" },
  { sr: 11, price: 5267.8, profit: 26, title: "Adrianna Papell Women’s Metallic Jacquard Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-130.png" },
  { sr: 12, price: 6242.98, profit: 36.76, title: "YUAKOU Women’s Tulle Petticoat Crinoline Half", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-154.png" },
  { sr: 13, price: 6001.01, profit: 30.4, title: "Rebecca Taylor womens Check Romper", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-155.png" },
  { sr: 14, price: 6311.22, profit: 34.6, title: "Adrianna Papell Women’s Metallic Knit Draped", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-166.png" },
  { sr: 15, price: 7959.06, profit: 863, title: "Upward Fit 20 Pack Bulk Yoga", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-179.png" },
  { sr: 16, price: 8790.77, profit: 45.22, title: "Givenchy L’interdit Women", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-204.png" },
  { sr: 17, price: 8682.33, profit: 40.96, title: "Christian Dior Jadore By Christian Dior", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-201.png" },
  { sr: 18, price: 8769.65, profit: 41.55, title: "GIORGIO ARMANI - Armani Code Eau", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-203.png" },
  { sr: 19, price: 8802.53, profit: 47.8, title: "Mongoose Fireball Dirt Jump Mens and", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-195.png" },
  { sr: 20, price: 8102.44, profit: 38.9, title: "iJoy Headphones Wireless Bluetooth- Wireless Sports", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-183.png" },
  { sr: 21, price: 8682.33, profit: 40.96, title: "Christian Dior Jadore By Christian Dior", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-201.png" },
  { sr: 22, price: 8769.65, profit: 41.55, title: "GIORGIO ARMANI - Armani Code Eau", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-203.png" },
  { sr: 23, price: 9100.3, profit: 49.7, title: "CHRISTIAN DIOR J’Adore Women Eau De", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-206.png" },
  { sr: 24, price: 8802.53, profit: 47.8, title: "Mongoose Fireball Dirt Jump Mens and", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-195.png" },
  { sr: 25, price: 8102.44, profit: 38.9, title: "iJoy Headphones Wireless Bluetooth- Wireless Sports", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-183.png" },
  { sr: 26, price: 7632.99, profit: 28.99, title: "Adrianna Papell Women’s Beaded Short Cocktail", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-167.png" },
  { sr: 27, price: 8913.84, profit: 46.22, title: "Sukeen Cooling Towel for Neck and", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-190.png" },
  { sr: 28, price: 8802.53, profit: 47.8, title: "Mongoose Fireball Dirt Jump Mens and", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-195.png" },
  { sr: 29, price: 8102.44, profit: 38.9, title: "iJoy Headphones Wireless Bluetooth- Wireless Sports", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-183.png" },
  { sr: 30, price: 9401.46, profit: 50.34, title: "Dolce & Gabbana The Only One", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-202.png" },
  { sr: 31, price: 12030.53, profit: 1737, title: "Boucheron Pour Femme Eau de Parfum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-214.png" },
  { sr: 32, price: 12876.55, profit: 90.34, title: "Chanel Coco Noir Eau De", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-218.png" },
  { sr: 33, price: 13309.65, profit: 100.4, title: "Dolce Shine Eau de", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-220.png" },
  { sr: 34, price: 13394.76, profit: 99.97, title: "Nicki Minaj Minajesty Eau de Parfum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-211.png" },
  { sr: 35, price: 12867.88, profit: 98.9, title: "Hugo Boss BOSS Bottled Eau de", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-215.png" },
  { sr: 36, price: 13427, profit: 89.99, title: "PAIGE Women’s High Waisted White Hardware", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-259.png" },
  { sr: 37, price: 14100.67, profit: 120.87, title: "Yardwe Fruit Basket Hammock Under Cabinet", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-254.png" },
  { sr: 38, price: 13998.73, profit: 110.77, title: "Annibale Colombo Bed", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-222.png" },
  { sr: 39, price: 14400.98, profit: 120.77, title: "Bamboo Spatula", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-260.png" },
  { sr: 40, price: 14521.52, profit: 130.73, title: "Wooden Bathroom Sink With Mirror", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-226.png" }
];

export const TEMPLATE_M_4 = [
  { sr: 1, price: 5882.45, profit: 30.11, title: "Rebecca Taylor Women’s Sleeveless Stripe Wrap", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-149.png" },
  { sr: 2, price: 5947.7, profit: 31.96, title: "Rebecca Taylor Women’s Ruched Scoop Neck", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-150.png" },
  { sr: 3, price: 6011.25, profit: 32.56, title: "Rebecca Taylor Women’s Godet Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-159.png" },
  { sr: 4, price: 5871.39, profit: 28.44, title: "Rebecca Taylor Women’s Violet Fleur Belted", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-148.png" },
  { sr: 5, price: 5993.64, profit: 30.23, title: "MAGE MALE Mens Suits Dress Floral", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-134.png" },
  { sr: 6, price: 5999.65, profit: 30.49, title: "Rebecca Taylor Women’s Sleeveless Bromstick Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-162.png" },
  { sr: 7, price: 6100.79, profit: 33.66, title: "Rebecca Taylor Women’s Agnes Embroidery Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-152.png" },
  { sr: 8, price: 6001.36, profit: 32.33, title: "MSemis Woman Sexy Mesh Sheer Transparent", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-153.png" },
  { sr: 9, price: 5997.99, profit: 31.44, title: "Rebecca Taylor Women’s Long Sleeve Shadow", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-160.png" },
  { sr: 10, price: 5779.99, profit: 28.87, title: "Rebecca Taylor Women’s Short Sleeve Dot", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-138.png" },
  { sr: 11, price: 5216.44, profit: 26.59, title: "Rebecca Taylor Women’s Cupro Shirt Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-144.png" },
  { sr: 12, price: 5993.64, profit: 31.22, title: "MAGE MALE Mens Suits Dress Floral", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-134.png" },
  { sr: 13, price: 5999.65, profit: 30.36, title: "Rebecca Taylor Women’s Sleeveless Bromstick Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-162.png" },
  { sr: 14, price: 6300.1, profit: 34.55, title: "siliteelon Women High Waist Casual Wide", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-158.png" },
  { sr: 15, price: 7680.25, profit: 630.22, title: "45W USB C Super Fast Charger", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-169.png" },
  { sr: 16, price: 8221.33, profit: 40.44, title: "Eunzel Yoga Towel", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-187.png" },
  { sr: 17, price: 8009.32, profit: 39.47, title: "FrenzyBird 6’x4’ Large Yoga Mat ¼”", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-180.png" },
  { sr: 18, price: 7998.77, profit: 38.59, title: "Xgody 2 in 1 Tablet 10.1", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-172.png" },
  { sr: 19, price: 8002.44, profit: 40.34, title: "NUTSAAKK Yoga Mat Holder Wall Mount", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-181.png" },
  { sr: 20, price: 7999.99, profit: 39.88, title: "Fullgaden Exercise Ball (55-75cm) with Quick", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-178.png" },
  { sr: 21, price: 8213.44, profit: 42.85, title: "Crostice Bike Mat Compatible with Peloton", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-189.png" },
  { sr: 22, price: 8112.47, profit: 42.03, title: "Nisorpa Yoga Auxiliary Foldable Chair with", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-182.png" },
  { sr: 23, price: 7865.36, profit: 39.56, title: "Google Pixel 6 Pro - 5G", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-175.png" },
  { sr: 24, price: 7922.48, profit: 39.33, title: "VEVOR Retractable Extension Cord Reel 65", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-171.png" },
  { sr: 25, price: 7998.77, profit: 38.93, title: "Xgody 2 in 1 Tablet 10.1", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-172.png" },
  { sr: 26, price: 8002.44, profit: 39.99, title: "NUTSAAKK Yoga Mat Holder Wall Mount", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-181.png" },
  { sr: 27, price: 8111.65, profit: 40.01, title: "Rebecca Taylor Women’s Sleeveless Scarlet Wrap", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-165.png" },
  { sr: 28, price: 7653.54, profit: 37.99, title: "Rebecca Taylor Women’s Sleeveless V-Neck Tweed", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-168.png" },
  { sr: 29, price: 8112.44, profit: 40.33, title: "Satechi 100W USB C PD Compact", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-176.png" },
  { sr: 30, price: 8176.84, profit: 41.22, title: "PS Squat Exercise Row Machine", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-184.png" },
  { sr: 31, price: 11032.87, profit: 1370.43, title: "Giorgio Armani Si Eau de Parfum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-207.png" },
  { sr: 32, price: 11165.55, profit: 99.98, title: "Schwinn Boundary Mountain Bike", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-197.png" },
  { sr: 33, price: 10008.65, profit: 97.44, title: "KHADLAJ PERFUMES Hareem Al Sultan Concentrated", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-205.png" },
  { sr: 34, price: 12001.43, profit: 99.99, title: "Gucci Flora Gorgeous Gardenia for Women", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-208.png" },
  { sr: 35, price: 12006.47, profit: 101.76, title: "Allure Sensuelle by Chanel for Women", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-213.png" },
  { sr: 36, price: 11678.88, profit: 97.55, title: "Schwinn Bonafide Men and Women Mountain", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-194.png" },
  { sr: 37, price: 11199.34, profit: 91.55, title: "5 Pack Cooling Towel", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-191.png" },
  { sr: 38, price: 12006.47, profit: 97.55, title: "Allure Sensuelle by Chanel for Women", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-213.png" },
  { sr: 39, price: 11165.55, profit: 97.11, title: "Schwinn Boundary Mountain Bike", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-197.png" },
  { sr: 40, price: 13001.43, profit: 106.77, title: "Dior J'adore", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-219.png" }
];

export const TEMPLATE_M_5 = [
  { sr: 1, price: 7998.88, profit: 45.99, title: "Manduka eQua Yoga Mat Towel -", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-186.png" },
  { sr: 2, price: 7689.23, profit: 40.69, title: "Rebecca Taylor Women’s Long Sleeve Perla", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-163.png" },
  { sr: 3, price: 8000.2, profit: 50.22, title: "Yoga Towel - Tie-Die Textures Non-Slip", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-185.png" },
  { sr: 4, price: 7946.81, profit: 47.1, title: "SAMSUNG Galaxy Z Flip 5 Cell", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-174.png" },
  { sr: 5, price: 7140.6, profit: 42.6, title: "Rebecca Taylor Women’s Daphne Fleur Dress", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-151.png" },
  { sr: 6, price: 7994.98, profit: 45.77, title: "Clutch Purse Evening Shoulder Pleated Bag", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-177.png" },
  { sr: 7, price: 8152.16, profit: 58.99, title: "PRUKIVRA Non Slip Yoga Towel with", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-188.png" },
  { sr: 8, price: 7863.91, profit: 43.9, title: "Rebecca Taylor Women’s Long Sleeve Star", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-164.png" },
  { sr: 9, price: 7891.61, profit: 45.22, title: "ACR ResQLink View - Buoyant Personal", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-170.png" },
  { sr: 10, price: 8235.71, profit: 60.1, title: "Huffy Stone Mountain Bike", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-193.png" },
  { sr: 11, price: 7812.73, profit: 50.44, title: "Rebecca Taylor Women’s Long Sleeve V-Neck", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-157.png" },
  { sr: 12, price: 7912.8, profit: 55.9, title: "Lenovo Tab P11 (2nd Gen) -", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-173.png" },
  { sr: 13, price: 10710.91, profit: 1384.81, title: "Schwinn Protocol 1.0 Mens and Womens", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-196.png" },
  { sr: 14, price: 12007.91, profit: 65.66, title: "Lubin Black Jade Eau de Parfum", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-212.png" },
  { sr: 15, price: 11854.88, profit: 60.7, title: "Lattafa Perfumes Asad for Unisex Eau", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-210.png" },
  { sr: 16, price: 11678.91, profit: 70.4, title: "Marc Jacobs Daisy Dream Eau de", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-209.png" },
  { sr: 17, price: 12115.6, profit: 75.8, title: "Hugo Boss Bottled Eau de Toilette", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-216.png" },
  { sr: 18, price: 11765.81, profit: 60.44, title: "KEAFOLS Cooling Towel Neck Wrap", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-192.png" },
  { sr: 19, price: 11623.66, profit: 60.41, title: "ALLURE WOMEN C H A N", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-198.png" },
  { sr: 20, price: 12118.4, profit: 70.1, title: "Calvin Klein CK One", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-217.png" },
  { sr: 21, price: 11862.88, profit: 70.4, title: "Rihanna Riri Eau De Parfum Spray", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-200.png" },
  { sr: 22, price: 12178.66, profit: 75.8, title: "Gucci Bloom Eau de", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-221.png" },
  { sr: 23, price: 11854.88, profit: 60.44, title: "Lattafa Perfumes Asad for Unisex Eau", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-210.png" },
  { sr: 24, price: 11678.91, profit: 60.41, title: "Marc Jacobs Daisy Dream Eau de", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-209.png" },
  { sr: 25, price: 12115.6, profit: 70.11, title: "Hugo Boss Bottled Eau de Toilette", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-216.png" },
  { sr: 26, price: 11765.81, profit: 60.59, title: "KEAFOLS Cooling Towel Neck Wrap", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-192.png" },
  { sr: 27, price: 11149.79, profit: 68.2, title: "Daisy By Marc Jacobs for Women", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-199.png" },
  { sr: 28, price: 16267.95, profit: 2616.51, title: "BALUS Reversible Sectional Sofa", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-255.png" },
  { sr: 29, price: 17654.76, profit: 120.67, title: "Hycredi Rectangle Sunglasses for Women Men", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-257.png" },
  { sr: 30, price: 17231.99, profit: 126.88, title: "Truckules Truck Phone Holder Mount Heavy", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-256.png" },
  { sr: 31, price: 17983.66, profit: 130.11, title: "Family Tree Photo Frame", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-249.png" },
  { sr: 32, price: 16984.88, profit: 110.26, title: "BOVADO USA 3 Cup Glass Food", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-253.png" },
  { sr: 33, price: 19112.66, profit: 180.67, title: "Table Lamp", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-252.png" },
  { sr: 34, price: 17883.9, profit: 150.66, title: "SODQW Aviator Sunglasses for Women Men", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-258.png" },
  { sr: 35, price: 15832.91, profit: 130.22, title: "Annibale Colombo Sofa", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-223.png" },
  { sr: 36, price: 19700.43, profit: 200.32, title: "Black Whisk", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-262.png" },
  { sr: 37, price: 18943.81, profit: 197.44, title: "Bedside Table African Cherry", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-224.png" },
  { sr: 38, price: 19432.61, profit: 199.9, title: "Knoll Saarinen Executive Conference Chair", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-225.png" },
  { sr: 39, price: 19842.64, profit: 200.4, title: "Black Aluminium Cup", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-261.png" },
  { sr: 40, price: 20007.67, profit: 382.8, title: "Electric Stove", image: "https://zxamlpfvggvoynhssbzd.supabase.co/storage/v1/object/public/cb_storage/products/cj-268.png" }
];

export const PRESET_OPTIONS = [
  { value: 'custom', name: 'Custom Worksheet (Manual)', details: 'Build custom worksheet step-by-step', badge: 'Manual' },
  { value: 'ai_edge', name: 'AI edge functioning Orders Assignment', details: 'Auto-populated dynamic progression (Order #1 -$18 to -$37 from balance, #2+ -$20 to -$40 balance adjustment, 5%-13% profit, 0.2%-0.3% commission)', badge: 'AI Edge' },
  { value: 'smart', name: 'Manual Parameter Generator', details: 'Generate random orders based on custom bounds', badge: 'Dynamic' },
  { value: 'M-1', name: 'Preset M-1', details: '40 Items • $30,000 Total • $210.00 Comm.', badge: 'Preset' },
  { value: 'M-2', name: 'Preset M-2', details: '40 Items • $98,000 Total • $496.00 Comm.', badge: 'Preset' },
  { value: 'M-3', name: 'Preset M-3', details: '40 Items • $353,000 Total • $4.6k Comm.', badge: 'Preset' },
  { value: 'M-4', name: 'Preset M-4', details: '40 Items • $508,000 Total • $7.6k Comm.', badge: 'Preset' },
  { value: 'M-5', name: 'Preset M-5', details: '40 Items • $508k Total • $7.6k Comm.', badge: 'Preset' },
  { value: 'C-1', name: 'Preset C-1', details: '40 Items • $817.00 Total • $2.69 Comm.', badge: 'Preset' },
  { value: 'C-2', name: 'Preset C-2', details: '40 Items • $3,900 Total • $49.00 Comm.', badge: 'Preset' },
  { value: 'C-3', name: 'Preset C-3', details: '40 Items • $104,000 Total • $9.2k Comm.', badge: 'Preset' },
  { value: 'C-4', name: 'Preset C-4', details: '40 Items • $75.9k Total • $6.4k Comm.', badge: 'Preset' },
  { value: 'C-5', name: 'Preset C-5', details: '40 Items • $148,000 Total • $14.6k Comm.', badge: 'Preset' },
];

export default function OrdersTasking() {
  const [activeTaskingTab, setActiveTaskingTab] = useState<'users' | 'worksheets'>('users');
  const [users, setUsers] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [session, setSession] = useState({ role: 'Owner', name: 'System Owner', email: 'owner@wallmark.com' });
  const [searchQuery, setSearchQuery] = useState('');

  // Form assignment states
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('custom'); // 'custom', 'ai_edge', 'smart', 'M-1', ...
  const [totalAmount, setTotalAmount] = useState('1000');
  const [orderCount, setOrderCount] = useState('5');
  const [profitPercent, setProfitPercent] = useState('5');
  const [showModal, setShowModal] = useState(false);
  const [newAssignOrders, setNewAssignOrders] = useState([]);
  const [freezeTarget, setFreezeTarget] = useState('');
  const [presetDropdownOpen, setPresetDropdownOpen] = useState(false);
  const [isCustomizingPreset, setIsCustomizingPreset] = useState(false);

  // Smart Generator States
  const [genOrderCount, setGenOrderCount] = useState('40');
  const [genMinPrice, setGenMinPrice] = useState('100');
  const [genMaxPrice, setGenMaxPrice] = useState('500');
  const [genMinCommission, setGenMinCommission] = useState('1');
  const [genMaxCommission, setGenMaxCommission] = useState('10');
  const [genMinProfit, setGenMinProfit] = useState('1');
  const [genMaxProfit, setGenMaxProfit] = useState('10');

  // AI Edge Generator States
  const [aiBasePrice, setAiBasePrice] = useState('100');
  const [aiOrderCount, setAiOrderCount] = useState('40');
  const [aiMinProfitPercent, setAiMinProfitPercent] = useState('5');
  const [aiMaxProfitPercent, setAiMaxProfitPercent] = useState('13');
  const [aiMinCommissionPercent, setAiMinCommissionPercent] = useState('0.2');
  const [aiMaxCommissionPercent, setAiMaxCommissionPercent] = useState('0.3');

  // Confirmation Dialog states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTaskData, setPendingTaskData] = useState(null);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Edit Worksheet Orders states
  const [showEditOrdersModal, setShowEditOrdersModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingOrders, setEditingOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const fetchUsersAndTasks = async () => {
    try {
      // Session
      const savedSession = localStorage.getItem('cb_admin_session');
      if (savedSession) {
        setSession(JSON.parse(savedSession));
      }

      // Users
      const { data: usersData, error: usersError } = await supabase
        .from('cb_users')
        .select('*')
        .order('reg_time', { ascending: false });

      if (!usersError && usersData) {
        const mappedUsers = usersData.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          phone: u.phone,
          nickname: u.nickname,
          level: u.level,
          rate: u.rate,
          acceptance: u.acceptance,
          online: u.online,
          balance: parseFloat(u.balance || 0),
          frozen: parseFloat(u.frozen || 0),
          topup: parseFloat(u.topup || 0),
          spentToday: parseFloat(u.spent_today || 0),
          spentCurrent: parseFloat(u.spent_current || 0),
          remaining: u.remaining,
          withdraw: u.withdraw,
          tpRecharge: parseFloat(u.tp_recharge || 0),
          beRecharge: parseFloat(u.be_recharge || 0),
          earnings: parseFloat(u.earnings || 0),
          commissions: parseFloat(u.commissions || 0),
          withdrawals: parseFloat(u.withdrawals || 0),
          inviteCode: u.invite_code,
          subs: u.subs,
          inviter: u.inviter,
          referred_by_staff_id: u.referred_by_staff_id,
          member_of_admin_id: u.member_of_admin_id,
          referral_id: u.referral_id,
          l1Agent: u.l1_agent,
          l2Agent: u.l2_agent,
          ip: u.ip,
          regTime: new Date(u.reg_time).toLocaleDateString()
        }));
        setUsers(mappedUsers);
      }

      // Assigned Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('cb_assigned_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tasksError && tasksData) {
        const mappedTasks = tasksData.map(t => ({
          id: t.id,
          userId: t.user_id,
          username: t.username,
          totalAmount: parseFloat(t.total_amount || 0),
          orderCount: t.order_count,
          profitPercent: parseFloat(t.profit_percent || 0),
          status: t.status,
          createdAt: new Date(t.created_at).toLocaleString(),
          assignedBy: t.assigned_by,
          orders: typeof t.orders === 'string' ? JSON.parse(t.orders) : t.orders,
          referred_by_staff_id: t.referred_by_staff_id || 'None',
          member_of_admin_id: t.member_of_admin_id || 'None'
        }));
        setAssignedTasks(mappedTasks);
      }
    } catch (err) {
      console.error("Error loading users and tasks:", err);
    }
  };

  const loadProducts = async () => {
    try {
      let activeProducts = PRODUCT_CATALOG;
      const { data: dbProducts } = await supabase.from('cb_products').select('*');
      if (dbProducts && dbProducts.length > 0) {
        activeProducts = dbProducts.map((p, idx) => ({
          id: p.id || `db-prod-${idx}`,
          title: p.title,
          image: p.image_url || p.image,
          type: p.type || 'gear',
          price: parseFloat(p.price || 0),
          profit: parseFloat(p.profit || 0)
        }));
      }
      setProducts(activeProducts);
    } catch (err) {
      console.error("Error loading products catalog:", err);
    }
  };

  useEffect(() => {
    fetchUsersAndTasks();
    loadProducts();
    const interval = setInterval(() => {
      if (document.hidden) return; // Save bandwidth when tab is in background!
      fetchUsersAndTasks();
    }, 15000); // Poll every 15 seconds instead of 3
    return () => clearInterval(interval);
  }, []);

  // Hierarchy filter based on role permissions
  const getFilteredUsers = () => {
    return users.filter(u => {
      // Role Node checking
      const s = session as any;
      if (s?.role === 'Admin') {
        if (u.member_of_admin_id !== s?.accountId) return false;
      } else if (s?.role === 'Staff') {
        if (u.referred_by_staff_id !== s?.accountId) return false;
      }

      // Search checking
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const usernameStr = u.username ? String(u.username).toLowerCase() : '';
        const idStr = u.id ? String(u.id).toLowerCase() : '';
        return usernameStr.includes(q) || idStr.includes(q);
      }

      return true;
    });
  };

  const getFilteredTasks = () => {
    return assignedTasks.filter(t => {
      // Role Node checking
      const s = session as any;
      if (s?.role === 'Admin') {
        if (t.member_of_admin_id !== s?.accountId) return false;
      } else if (s?.role === 'Staff') {
        if (t.referred_by_staff_id !== s?.accountId) return false;
      }
      return true;
    });
  };

  const handleOpenAssignModal = async (user, defaultTemplate = 'custom') => {
    if (!user) return;
    const targetUsername = user.username ? String(user.username).toLowerCase() : '';

    // Check if user has an active task already
    const activeTask = assignedTasks.find(t => 
      t && t.username && String(t.username).toLowerCase() === targetUsername && 
      (t.status === 'Pending' || t.status === 'In Progress')
    );

    if (activeTask) {
      toast.error(`User ${user.username || 'Client'} already has an active task in progress (${activeTask.status}). Please complete or cancel it before assigning a new one.`);
      return;
    }

    let liveUser = { ...user };
    try {
      const { data: dbUser } = await supabase
        .from('cb_users')
        .select('balance')
        .eq('id', user.id)
        .maybeSingle();

      if (dbUser && typeof dbUser.balance !== 'undefined') {
        const freshBal = parseFloat(dbUser.balance || 0);
        if (!isNaN(freshBal)) {
          liveUser.balance = freshBal;
        }
      }
    } catch (err) {
      console.warn("Could not fetch fresh user balance:", err);
    }

    setSelectedUser(liveUser);
    setSelectedTemplate(defaultTemplate);
    setIsCustomizingPreset(false);
    setFreezeTarget('');

    const uBal = liveUser.balance > 0 ? String(liveUser.balance) : '100';
    setAiBasePrice(uBal);

    if (defaultTemplate === 'ai_edge') {
      generateAiEdgeOrders(liveUser, uBal, '40', true);
    } else {
      // Initialize with 1 empty manual order
      setNewAssignOrders([
        { title: '', image: '', price: '100', profit: '10', status: 'Pending' }
      ]);
    }
    setShowModal(true);
  };

  const generateAiEdgeOrders = (targetUser = selectedUser, basePriceStr = aiBasePrice, countStr = aiOrderCount, isQuiet = false) => {
    const count = parseInt(countStr) || 40;
    
    // Explicitly determine user wallet balance at time of creation
    const userWalletBalance = targetUser && typeof targetUser.balance === 'number' ? targetUser.balance : (targetUser ? parseFloat(targetUser.balance || 0) : 0);
    
    // Parse starting balance (updated_wallet_balance)
    let updated_wallet_balance = parseFloat(basePriceStr);
    if (isNaN(updated_wallet_balance) || updated_wallet_balance <= 0) {
      updated_wallet_balance = userWalletBalance > 0 ? userWalletBalance : 100;
    }

    // Profit rate randomly between 0.2% to 0.3% of product price
    const minCommP = (parseFloat(aiMinCommissionPercent) || 0.2) / 100;
    const maxCommP = (parseFloat(aiMaxCommissionPercent) || 0.3) / 100;

    const catalog = products.length > 0 ? products : PRODUCT_CATALOG;
    const generatedOrders = [];

    // Track running simulated user balance after each order is submitted with profit
    let runningUserBalance = updated_wallet_balance;

    for (let i = 0; i < count; i++) {
      let orderPrice = 0;

      // Each order (Order #1 to #40): calculated as running balance - ($18 to $37 randomly)
      const reduction = Math.random() * (37 - 18) + 18;
      orderPrice = Math.max(10, runningUserBalance - reduction);
      orderPrice = parseFloat(orderPrice.toFixed(2));

      // Profit amount: randomly between 0.2% to 0.3% of product price
      const profitRate = minCommP + Math.random() * (maxCommP - minCommP);
      const totalProfitVal = parseFloat((orderPrice * profitRate).toFixed(2));

      // User's updated balance after completing this order (principal + profit)
      runningUserBalance = parseFloat((runningUserBalance + totalProfitVal).toFixed(2));

      const catalogItem = catalog[i % catalog.length];
      const title = catalogItem ? catalogItem.title : `AI Edge Product #${i + 1}`;
      const image = catalogItem ? catalogItem.image : null;

      generatedOrders.push({
        title: title,
        image: image,
        price: orderPrice.toFixed(2),
        profit: totalProfitVal.toFixed(2),
        status: 'Pending'
      });
    }

    setNewAssignOrders(generatedOrders);
    if (!isQuiet) {
      toast.success(`Generated ${count} AI Edge functioning orders with balance-reduction logic!`);
    }
  };

  const handleOrderCountChange = (valStr) => {
    let count = parseInt(valStr || '0');
    if (isNaN(count)) count = 0;
    if (count < 1) count = 1;
    if (count > 40) count = 40;

    setNewAssignOrders((prev) => {
      const next = [...prev];
      if (count > next.length) {
        for (let i = next.length; i < count; i++) {
          next.push({ title: '', image: '', price: '100', profit: '10', status: 'Pending' });
        }
      } else if (count < next.length) {
        return next.slice(0, count);
      }
      return next;
    });
  };

  const handleAddOrder = () => {
    setNewAssignOrders((prev) => [
      ...prev,
      { title: '', image: '', price: '100', profit: '10', status: 'Pending' }
    ]);
  };

  const handleRemoveOrder = (idx) => {
    setNewAssignOrders((prev) => {
      if (prev.length <= 1) {
        toast.error("A task must have at least one order.");
        return prev;
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  const safeFloat = (val) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleInitiateAssignment = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    let finalOrdersList = [...newAssignOrders];

    // Ensure AI Edge Order #1 price is computed strictly as updated_wallet_balance - (Math.random() * (37 - 18) + 18) at task creation
    if (selectedTemplate === 'ai_edge' && finalOrdersList.length > 0) {
      const liveBal = parseFloat(aiBasePrice) > 0 ? parseFloat(aiBasePrice) : (selectedUser.balance > 0 ? selectedUser.balance : 100);
      const updated_wallet_balance = isNaN(liveBal) || liveBal <= 0 ? 100 : liveBal;
      const firstReduction = Math.random() * (37 - 18) + 18;
      const order1Price = Math.max(10, parseFloat((updated_wallet_balance - firstReduction).toFixed(2)));
      
      const minProfP = (parseFloat(aiMinProfitPercent) || 5) / 100;
      const maxProfP = (parseFloat(aiMaxProfitPercent) || 13) / 100;
      const minCommP = (parseFloat(aiMinCommissionPercent) || 0.2) / 100;
      const maxCommP = (parseFloat(aiMaxCommissionPercent) || 0.3) / 100;
      const profitRate = minProfP + Math.random() * (maxProfP - minProfP);
      const commRate = minCommP + Math.random() * (maxCommP - minCommP);
      const totalProfitVal = parseFloat(((order1Price * profitRate) + (order1Price * commRate)).toFixed(2));

      finalOrdersList[0] = {
        ...finalOrdersList[0],
        price: order1Price.toFixed(2),
        profit: totalProfitVal.toFixed(2)
      };
    }

    // Validate all manual orders
    for (let idx = 0; idx < finalOrdersList.length; idx++) {
      const o = finalOrdersList[idx];
      if (!o.title) {
        toast.error(`Order #${idx + 1} has no product selected/configured.`);
        return;
      }
      const priceVal = safeFloat(o.price);
      const profitVal = safeFloat(o.profit);
      if (priceVal <= 0) {
        toast.error(`Order #${idx + 1} must have a valid positive price.`);
        return;
      }
      if (profitVal < 0) {
        toast.error(`Order #${idx + 1} must have a valid positive commission.`);
        return;
      }
    }

    // Compute totals with 2-decimal precision
    const totalAmountSum = parseFloat(finalOrdersList.reduce((sum, o) => sum + safeFloat(o.price), 0).toFixed(2));
    const totalProfitSum = parseFloat(finalOrdersList.reduce((sum, o) => sum + safeFloat(o.profit), 0).toFixed(2));
    const orderCountVal = finalOrdersList.length;
    const computedProfitPercent = totalAmountSum > 0 ? parseFloat(((totalProfitSum / totalAmountSum) * 100).toFixed(2)) : 0;

    // Generate unique order IDs with cleaned 2-decimal values
    const ordersWithIds = finalOrdersList.map((o, idx) => ({
      id: Date.now() + idx,
      title: o.title,
      image: o.image || null,
      price: parseFloat(safeFloat(o.price).toFixed(2)),
      profit: parseFloat(safeFloat(o.profit).toFixed(2)),
      status: 'Pending',
      isFreezeTarget: freezeTarget === String(idx + 1),
      task_type: selectedTemplate === 'ai_edge' ? 'ai_edge' : 'normal',
      disable_referral_commission: selectedTemplate === 'ai_edge'
    }));

    const newTask = {
      id: 'TSK-' + Math.floor(10000 + Math.random() * 90000),
      user_id: selectedUser.id,
      username: selectedUser.username,
      total_amount: totalAmountSum,
      order_count: orderCountVal,
      profit_percent: computedProfitPercent,
      status: 'Pending',
      created_at: new Date().toISOString(),
      assigned_by: session.name,
      orders: ordersWithIds,
      referred_by_staff_id: selectedUser.referred_by_staff_id || null,
      member_of_admin_id: selectedUser.member_of_admin_id || null
    };

    const presetObj = PRESET_OPTIONS.find(p => p.value === selectedTemplate) || PRESET_OPTIONS[0];

    setPendingTaskData({
      task: newTask,
      orders: ordersWithIds,
      user: selectedUser,
      totalAmount: totalAmountSum,
      totalProfit: totalProfitSum,
      orderCount: orderCountVal,
      profitPercent: computedProfitPercent,
      templateName: presetObj.name,
      templateBadge: presetObj.badge,
      freezeTarget: freezeTarget || null
    });

    setShowConfirmModal(true);
  };

  const handleFinalizeAssignment = async () => {
    if (!pendingTaskData || !pendingTaskData.task) return;

    setIsSubmittingTask(true);
    const { task: newTask, orders: ordersWithIds, user, orderCount: orderCountVal } = pendingTaskData;

    try {
      // Clean payload ensuring only standard supported table columns are inserted
      const cleanTaskPayload = {
        id: newTask.id,
        user_id: newTask.user_id,
        username: newTask.username,
        total_amount: newTask.total_amount,
        order_count: newTask.order_count,
        profit_percent: newTask.profit_percent,
        status: newTask.status,
        created_at: newTask.created_at,
        assigned_by: newTask.assigned_by,
        orders: newTask.orders,
        referred_by_staff_id: newTask.referred_by_staff_id || null,
        member_of_admin_id: newTask.member_of_admin_id || null
      };

      const { error } = await supabase
        .from('cb_assigned_tasks')
        .insert([cleanTaskPayload]);

      if (error) {
        console.error("Error inserting task into cb_assigned_tasks:", error);
        toast.error("Error assigning task: " + error.message);
        setIsSubmittingTask(false);
        return;
      }

      // Pre-populate cb_orders so the user sees them immediately in the Pending tab
      const dbOrders = ordersWithIds.map((o, idx) => ({
        id: String(o.id || (Date.now() + '-' + idx + '-' + Math.floor(Math.random() * 10000))),
        username: user.username,
        timestamp: new Date().toISOString(),
        status: 'Pending',
        title: o.title,
        image: o.image || null,
        price: o.price,
        profit: o.profit,
        type: o.isFreezeTarget ? 'freeze' : 'product',
        assigned_task_id: newTask.id,
        assigned_order_index: idx
      }));

      const { error: insertOrdersError } = await supabase
        .from('cb_orders')
        .upsert(dbOrders, { onConflict: 'id' });

      if (insertOrdersError) {
        console.warn("Error upserting orders into cb_orders, attempting direct insert fallback:", insertOrdersError.message);
        await supabase.from('cb_orders').insert(dbOrders);
      }

      setShowConfirmModal(false);
      setShowModal(false);
      setSelectedUser(null);
      setPendingTaskData(null);
      setIsSubmittingTask(false);
      toast.success(`Successfully assigned task ${newTask.id} with ${orderCountVal} orders to user ${newTask.username}!`);
      fetchUsersAndTasks();
    } catch (err: any) {
      console.error("Exception finalizing task assignment:", err);
      toast.error("Failed to assign task: " + (err?.message || String(err)));
      setIsSubmittingTask(false);
    }
  };

  const handleCancelTask = async (taskId) => {
    if (window.confirm("Are you sure you want to cancel and delete this assigned task? All pending orders will be removed.")) {
      try {
        // Step 1: Delete all linked orders from cb_orders
        const { error: ordersDeleteError } = await supabase
          .from('cb_orders')
          .delete()
          .eq('assigned_task_id', taskId);

        if (ordersDeleteError) {
          toast.error("Error removing linked orders: " + ordersDeleteError.message);
          return;
        }

        // Step 2: Delete the task itself from cb_assigned_tasks
        const { error: taskDeleteError } = await supabase
          .from('cb_assigned_tasks')
          .delete()
          .eq('id', taskId);

        if (taskDeleteError) {
          toast.error("Error deleting task: " + taskDeleteError.message);
          return;
        }

        toast.success("Task and all linked orders cancelled and deleted successfully.");
        fetchUsersAndTasks();
      } catch (err) {
        toast.error("Failed to delete task: " + err.message);
      }
    }
  };

  const handleSaveEditedOrders = async () => {
    if (!editingTask) return;
    
    try {
      const updatedOrders = editingOrders.map(o => ({
        ...o,
        price: parseFloat(o.price || 0),
        profit: parseFloat(o.profit || 0),
        commission: parseFloat(o.commission || 0)
      }));
      
      const newTotalAmount = parseFloat(updatedOrders.reduce((sum, o) => sum + (o.price || 0), 0).toFixed(2));
      const newTotalProfit = parseFloat(updatedOrders.reduce((sum, o) => sum + (o.profit || 0), 0).toFixed(2));
      const newProfitPercent = newTotalAmount > 0 ? parseFloat(((newTotalProfit / newTotalAmount) * 100).toFixed(2)) : 0;

      const { error: taskError } = await supabase
        .from('cb_assigned_tasks')
        .update({ 
          orders: updatedOrders,
          total_amount: newTotalAmount,
          profit_percent: newProfitPercent
        })
        .eq('id', editingTask.id);
        
      if (taskError) throw taskError;
      
      // Update individual orders in cb_orders
      for (let idx = 0; idx < updatedOrders.length; idx++) {
        const order = updatedOrders[idx];
        if (order.id) {
          await supabase
            .from('cb_orders')
            .update({
              title: order.title,
              image: order.image,
              price: order.price,
              profit: order.profit
            })
            .eq('id', order.id);
        } else {
          await supabase
            .from('cb_orders')
            .update({
              title: order.title,
              image: order.image,
              price: order.price,
              profit: order.profit
            })
            .eq('assigned_task_id', editingTask.id)
            .eq('assigned_order_index', idx);
        }
      }
      
      toast.success("Worksheet orders updated successfully!");
      setShowEditOrdersModal(false);
      setEditingTask(null);
      fetchUsersAndTasks();
    } catch (err: any) {
      toast.error("Failed to update orders: " + err.message);
    }
  };

  const getActiveTaskDisplay = (username: any) => {
    if (!username) return <span className="text-slate-400 text-sm font-medium">None</span>;
    const target = String(username).toLowerCase();
    const task = assignedTasks.find(t => 
      t && t.username && String(t.username).toLowerCase() === target && 
      (t.status === 'Pending' || t.status === 'In Progress')
    );
    if (!task) return <span className="text-slate-400 text-sm font-medium">None</span>;
    const completed = Array.isArray(task.orders) ? task.orders.filter((o: any) => o.status === 'Success').length : 0;
    return (
      <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-xs font-semibold border ${task.status === 'In Progress' ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' : 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'}`}>
        <span>{task.status}</span>
        <span className="opacity-75">({completed}/{task.orderCount || (task.orders ? task.orders.length : 0)})</span>
      </span>
    );
  };

  // Preview computations
  const avgAmt = selectedUser ? (parseFloat(totalAmount) / parseInt(orderCount || '1')).toFixed(2) : '0.00';
  const profPerOrd = selectedUser ? (parseFloat(avgAmt) * (parseFloat(profitPercent || '0') / 100)).toFixed(2) : '0.00';
  const totalProf = selectedUser ? (parseFloat(profPerOrd) * parseInt(orderCount || '1')).toFixed(2) : '0.00';

  const filteredUsers = getFilteredUsers();
  const filteredTasks = getFilteredTasks();

  return (
    <div className="admin-page-container space-y-6">
      {/* Header and Subtabs matching FinancialCenter layout */}
      <div className="admin-card">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-xl tracking-tight flex items-center gap-2.5">
              <Briefcase className="w-6 h-6 text-indigo-500" />
              <span>Orders Tasking & Allocations</span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Assign task sequences, configure order profit margins, and manage client worksheets.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button 
              className={`px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTaskingTab === 'users' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700 font-bold' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
              onClick={() => setActiveTaskingTab('users')}
            >
              User Allocations ({filteredUsers.length})
            </button>
            <button 
              className={`px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTaskingTab === 'worksheets' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 shadow-sm border border-slate-200 dark:border-slate-700 font-bold' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
              onClick={() => setActiveTaskingTab('worksheets')}
            >
              Active Worksheets ({filteredTasks.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar matching FinancialCenter */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Search user ID or username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-sm focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
          />
        </div>
      </div>

      <div className="admin-card !p-0 overflow-hidden flex flex-col mt-6 shadow-xs border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="overflow-x-auto">
          {activeTaskingTab === 'users' ? (
            <table className="w-full min-w-[980px] whitespace-nowrap text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-5 align-middle">User ID</th>
                  <th className="px-5 py-5 align-middle">Username</th>
                  <th className="px-5 py-5 align-middle">Staff Node</th>
                  <th className="px-5 py-5 align-middle">Active Balance</th>
                  <th className="px-5 py-5 align-middle">Active Task Progress</th>
                  <th className="px-5 py-5 text-right align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-7 py-16 text-center text-slate-500 dark:text-slate-400 font-medium text-base">
                      No client accounts found matching filter node.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="min-h-16 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group">
                      <td className="px-5 py-5 align-middle">
                        <span className="font-mono text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">{u.id.substring(0,8)}...</span>
                      </td>
                      <td className="px-5 py-5 font-bold text-slate-900 dark:text-slate-50 text-base align-middle">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                            {u.username.substring(0,2).toUpperCase()}
                          </div>
                          <span className="text-slate-900 dark:text-white font-bold">{u.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5 align-middle">
                        <span className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg text-sm font-semibold">{u.referred_by_staff_id}</span>
                      </td>
                      <td className="px-5 py-5 align-middle">
                        <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/40 inline-block">
                          ${parseFloat(u.balance).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-5 align-middle">{getActiveTaskDisplay(u.username)}</td>
                      <td className="px-5 py-5 text-right align-middle">
                        <div className="flex items-center gap-2 justify-end">
                          <button 
                            type="button"
                            className="px-3.5 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-200 dark:hover:bg-purple-300 border border-purple-300 dark:border-purple-400 active:scale-95 text-indigo-950 dark:text-indigo-950 font-black text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                            onClick={() => handleOpenAssignModal(u, 'ai_edge')}
                            title="AI edge functioning Orders Assignment"
                          >
                            <Sparkles className="w-3.5 h-3.5 stroke-[2.5] text-indigo-950 dark:text-indigo-950 shrink-0" />
                            <span className="font-extrabold text-indigo-950 dark:text-indigo-950">AI Edge Assignment</span>
                          </button>
                          <button 
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs border border-indigo-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                            onClick={() => handleOpenAssignModal(u)}
                          >
                            <UserPlus className="w-4 h-4 stroke-[2.5]" />
                            <span>Assign Task</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[1080px] whitespace-nowrap text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <th className="px-5 py-5 align-middle">Task ID</th>
                  <th className="px-5 py-5 align-middle">Client User</th>
                  <th className="px-5 py-5 align-middle">Total Amount</th>
                  <th className="px-5 py-5 align-middle">Orders</th>
                  <th className="px-5 py-5 align-middle">Yield %</th>
                  <th className="px-5 py-5 align-middle">Status</th>
                  <th className="px-5 py-5 align-middle">Assigned By</th>
                  <th className="px-5 py-5 align-middle">Created Date</th>
                  <th className="px-5 py-5 text-right align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-7 py-16 text-center text-slate-500 dark:text-slate-400 font-medium text-base">
                      No active worksheets found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-5 align-middle">
                        <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-800/40">{t.id}</span>
                      </td>
                      <td className="px-5 py-5 font-bold text-slate-900 dark:text-slate-50 text-base align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                            {t.username.substring(0,2).toUpperCase()}
                          </div>
                          <span>{t.username}</span>
                        </div>
                      </td>
                      <td className="px-5 py-5 align-middle font-mono font-bold text-slate-900 dark:text-slate-50 text-base tabular-nums">
                        ${t.totalAmount.toFixed(2)}
                      </td>
                      <td className="px-5 py-5 align-middle text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {t.orderCount} orders
                      </td>
                      <td className="px-5 py-5 align-middle">
                        <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-indigo-950/60 px-3 py-2 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                          +{t.profitPercent}%
                        </span>
                      </td>
                      <td className="px-5 py-5 align-middle">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider ${
                          t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40' :
                          t.status === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40' :
                          'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-5 align-middle text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {t.assignedBy}
                      </td>
                      <td className="px-5 py-5 align-middle text-sm text-slate-500 dark:text-slate-400 font-mono">
                        {t.createdAt}
                      </td>
                      <td className="px-5 py-5 text-right align-middle">
                         <button 
                          className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer ml-auto"
                          onClick={() => {
                            setEditingTask(t);
                            setEditingOrders((t.orders || []).map(o => ({
                              ...o,
                              price: String(o.price ?? 0),
                              profit: String(o.profit ?? 0),
                              commission: String(o.commission !== undefined ? o.commission : (parseFloat((Number(o.profit || 0) * 0.1).toFixed(2))))
                            })));
                            setShowEditOrdersModal(true);
                          }}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Orders
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Assign Task Modal */}
      {showModal && selectedUser && (() => {
        const handlePresetSelect = (mode) => {
          setSelectedTemplate(mode);
          setPresetDropdownOpen(false);
          if (mode === 'M-1') {
            setNewAssignOrders(TEMPLATE_M_1.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'M-2') {
            setNewAssignOrders(TEMPLATE_M_2.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'M-3') {
            setNewAssignOrders(TEMPLATE_M_3.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'M-4') {
            setNewAssignOrders(TEMPLATE_M_4.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'M-5') {
            setNewAssignOrders(TEMPLATE_M_5.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'C-1') {
            setNewAssignOrders(TEMPLATE_C_1.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'C-2') {
            setNewAssignOrders(TEMPLATE_C_2.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'C-3') {
            setNewAssignOrders(TEMPLATE_C_3.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'C-4') {
            setNewAssignOrders(TEMPLATE_C_4.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));
          } else if (mode === 'C-5') {
            setNewAssignOrders(TEMPLATE_C_5.map(item => ({
              title: item.title,
              image: item.image,
              price: item.price.toString(),
              profit: item.profit.toString(),
              status: 'Pending'
            })));

          } else if (mode === 'ai_edge') {
            const uBal = selectedUser && selectedUser.balance > 0 ? String(selectedUser.balance) : (aiBasePrice || '100');
            setAiBasePrice(uBal);
            generateAiEdgeOrders(selectedUser, uBal, aiOrderCount || '40', true);
          } else if (mode === 'smart') {
            // Keep current orders or show generator UI
          } else {
            setNewAssignOrders([
              { title: '', image: '', price: '100', profit: '10', status: 'Pending' }
            ]);
          }
        };

        const handleGenerateSmartSequence = () => {
          const count = parseInt(genOrderCount) || 40;
          const minP = parseFloat(genMinPrice) || 100;
          const maxP = parseFloat(genMaxPrice) || 500;
          const minComm = parseFloat(genMinCommission) || 1;
          const maxComm = parseFloat(genMaxCommission) || 10;
          const minProf = parseFloat(genMinProfit) || 1;
          const maxProf = parseFloat(genMaxProfit) || 10;

          if (maxP < minP) {
            toast.error("Max Price must be greater than Min Price");
            return;
          }
          
          const generated = [];
          for (let i = 0; i < count; i++) {
            // Pick a random product from catalog for title/image
            const randomProd = PRODUCT_CATALOG[Math.floor(Math.random() * PRODUCT_CATALOG.length)];
            const randomPrice = parseFloat((Math.random() * (maxP - minP) + minP).toFixed(2));
            
            // Calculate random commission and random profit components
            const rComm = parseFloat((Math.random() * (maxComm - minComm) + minComm).toFixed(2));
            const rProf = parseFloat((Math.random() * (maxProf - minProf) + minProf).toFixed(2));
            
            // The final 'profit' field in the system will be the sum of both components
            const finalProfit = (rComm + rProf).toFixed(2);

            generated.push({
              title: randomProd.title,
              image: randomProd.image,
              price: randomPrice.toString(),
              profit: finalProfit,
              status: 'Pending'
            });
          }

          setNewAssignOrders(generated);
          setIsCustomizingPreset(true); // Switch to list view so they can edit
          toast.success(`Generated ${count} random orders with combined Commission + Profit components.`);
        };

        const currentPreset = PRESET_OPTIONS.find(p => p.value === selectedTemplate) || PRESET_OPTIONS[0];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 transition-all">
            <div className="bg-white dark:bg-slate-950 w-full max-w-6xl overflow-hidden flex flex-col h-[90dvh] max-h-[900px] min-h-0 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800">
              {/* Modal Header */}
              <div className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between flex-shrink-0 px-4 py-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">Allocate Worksheet</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Creating tasking layout for <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedUser.username}</span></p>
                  </div>
                </div>
                <button 
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                  onClick={() => { setShowModal(false); setSelectedUser(null); }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleInitiateAssignment} className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="flex-1 overflow-y-auto flex flex-col gap-6 sm:gap-8 min-h-0 p-4 sm:p-6 lg:p-8">
                  
                  {/* Worksheet Template Selector Card */}
                  <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col gap-3.5 shadow-xs">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Worksheet Template Preset
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPresetDropdownOpen(!presetDropdownOpen)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/20 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2.5">
                              {currentPreset.name}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                                {currentPreset.badge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{currentPreset.details}</p>
                          </div>
                        </div>
                        <div className="text-slate-400 pr-1 shrink-0">
                          {presetDropdownOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </button>

                      {presetDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setPresetDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 mt-2 z-50 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                            {PRESET_OPTIONS.map((p) => {
                              const isSelected = p.value === selectedTemplate;
                              return (
                                <button
                                  key={p.value}
                                  type="button"
                                  onClick={() => handlePresetSelect(p.value)}
                                  className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors cursor-pointer ${
                                    isSelected 
                                      ? 'bg-indigo-50/50 dark:bg-indigo-950/25' 
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/60'
                                  }`}
                                >
                                  <div className="flex items-center gap-3.5">
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                                      isSelected 
                                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                                        : 'bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400'
                                    }`}>
                                      {p.value === 'custom' ? 'M' : p.value}
                                    </div>
                                    <div>
                                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{p.name}</div>
                                      <div className="text-xs text-slate-400 mt-1">{p.details}</div>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Target Freeze Selector Card */}
                  <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col gap-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Target Freeze Row (Optional)
                      </label>
                      {freezeTarget && (
                        <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/50">
                          Active Freeze: Row #{freezeTarget}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={freezeTarget}
                        onChange={(e) => setFreezeTarget(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-colors cursor-pointer shadow-2xs"
                      >
                        <option value="">None (Standard Task Progression - No Freeze Point)</option>
                        {newAssignOrders.map((o, idx) => (
                          <option key={idx} value={String(idx + 1)}>
                            Row #{idx + 1}: {o.title ? (o.title.length > 45 ? o.title.substring(0, 45) + '...' : o.title) : `Order #${idx + 1}`} (${safeFloat(o.price).toFixed(2)}) - Target Freeze
                          </option>
                        ))}
                      </select>
                      {freezeTarget && (
                        <button
                          type="button"
                          onClick={() => setFreezeTarget('')}
                          className="h-12 px-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                      When the user reaches this specific row during picking, their balance will freeze and they will be prompted to top up before continuing.
                    </p>
                  </div>

                  {selectedTemplate === 'ai_edge' && !isCustomizingPreset && (
                    <div className="p-6 sm:p-7 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-3xl flex flex-col gap-6 shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2 flex-wrap">
                            <span>AI Edge Functioning Orders Assignment</span>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              Auto Referral Disabled
                            </span>
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Auto 10% referral commission disabled. Order #1 is $18-$37 less than starting balance. Product #2+ price populated automatically by reducing $20-$40 from updated user balance.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">Product Base Price ($)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={aiBasePrice} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setAiBasePrice(val);
                              generateAiEdgeOrders(selectedUser, val, aiOrderCount, true);
                            }}
                            placeholder="e.g. 100"
                            className="h-11 px-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Count of Orders</label>
                          <input 
                            type="number" 
                            value={aiOrderCount} 
                            onChange={(e) => {
                              const val = e.target.value;
                              setAiOrderCount(val);
                              generateAiEdgeOrders(selectedUser, aiBasePrice, val, true);
                            }}
                            placeholder="40"
                            className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-emerald-700 dark:text-emerald-400">
                          <label className="text-[11px] font-bold uppercase tracking-wider">Profit Range (%)</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              step="0.1"
                              value={aiMinProfitPercent} 
                              onChange={(e) => {
                                setAiMinProfitPercent(e.target.value);
                                generateAiEdgeOrders(selectedUser, aiBasePrice, aiOrderCount, true);
                              }}
                              className="w-1/2 h-11 px-3 text-center rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              placeholder="5"
                            />
                            <span className="text-xs font-bold text-slate-400">to</span>
                            <input 
                              type="number" 
                              step="0.1"
                              value={aiMaxProfitPercent} 
                              onChange={(e) => {
                                setAiMaxProfitPercent(e.target.value);
                                generateAiEdgeOrders(selectedUser, aiBasePrice, aiOrderCount, true);
                              }}
                              className="w-1/2 h-11 px-3 text-center rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                              placeholder="13"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 text-blue-700 dark:text-blue-400 md:col-span-2 lg:col-span-3">
                          <label className="text-[11px] font-bold uppercase tracking-wider">Commission Range (%)</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              step="0.01"
                              value={aiMinCommissionPercent} 
                              onChange={(e) => {
                                setAiMinCommissionPercent(e.target.value);
                                generateAiEdgeOrders(selectedUser, aiBasePrice, aiOrderCount, true);
                              }}
                              className="w-1/2 h-11 px-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              placeholder="0.2"
                            />
                            <span className="text-xs font-bold text-slate-400">to</span>
                            <input 
                              type="number" 
                              step="0.01"
                              value={aiMaxCommissionPercent} 
                              onChange={(e) => {
                                setAiMaxCommissionPercent(e.target.value);
                                generateAiEdgeOrders(selectedUser, aiBasePrice, aiOrderCount, true);
                              }}
                              className="w-1/2 h-11 px-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                              placeholder="0.3"
                            />
                          </div>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => generateAiEdgeOrders(selectedUser, aiBasePrice, aiOrderCount)}
                        className="w-full h-12 bg-purple-100 hover:bg-purple-200 dark:bg-purple-200 dark:hover:bg-purple-300 border border-purple-300 dark:border-purple-400 text-indigo-950 dark:text-indigo-950 font-extrabold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <Sparkles className="w-5 h-5 text-indigo-950 dark:text-indigo-950 shrink-0" />
                        <span className="text-indigo-950 dark:text-indigo-950 font-extrabold">Generate AI Edge Functioning Orders</span>
                      </button>
                    </div>
                  )}

                  {(selectedTemplate === 'custom' || selectedTemplate === 'smart') && !isCustomizingPreset && (
                    <div className="p-6 sm:p-7 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 rounded-3xl flex flex-col gap-6 shadow-sm">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white text-lg">Manual Parameter Generator</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automate worksheet creation with random bounds</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Order Count</label>
                          <input 
                            type="number" 
                            value={genOrderCount} 
                            onChange={(e) => setGenOrderCount(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-indigo-700 dark:text-indigo-300">
                          <label className="text-[11px] font-bold uppercase tracking-wider">Min Product Value ($)</label>
                          <input 
                            type="number" 
                            value={genMinPrice} 
                            onChange={(e) => setGenMinPrice(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-indigo-700 dark:text-indigo-300">
                          <label className="text-[11px] font-bold uppercase tracking-wider">Max Product Value ($)</label>
                          <input 
                            type="number" 
                            value={genMaxPrice} 
                            onChange={(e) => setGenMaxPrice(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-blue-600 dark:text-blue-400">
                          <label className="text-[11px] font-bold uppercase tracking-wider">Min Commission ($)</label>
                          <input 
                            type="number" 
                            value={genMinCommission} 
                            onChange={(e) => setGenMinCommission(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-blue-600 dark:text-blue-400">
                          <label className="text-[11px] font-bold uppercase tracking-wider">Max Commission ($)</label>
                          <input 
                            type="number" 
                            value={genMaxCommission} 
                            onChange={(e) => setGenMaxCommission(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-emerald-600 dark:text-emerald-400">
                          <label className="text-[11px] font-bold uppercase tracking-wider">Min Profit ($)</label>
                          <input 
                            type="number" 
                            value={genMinProfit} 
                            onChange={(e) => setGenMinProfit(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          />
                        </div>
                        <div className="flex flex-col gap-2 text-emerald-600 dark:text-emerald-400">
                          <label className="text-[11px] font-bold uppercase tracking-wider">Max Profit ($)</label>
                          <input 
                            type="number" 
                            value={genMaxProfit} 
                            onChange={(e) => setGenMaxProfit(e.target.value)}
                            className="h-11 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={handleGenerateSmartSequence}
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <Sparkles className="w-5 h-5" />
                        Generate Custom Worksheet Sequence
                      </button>
                    </div>
                  )}

                  {(selectedTemplate === 'custom' || selectedTemplate === 'ai_edge' || selectedTemplate === 'smart' || isCustomizingPreset) && (
                    <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">Worksheet Row Builder</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Adjust individual prices, commissions, or add/deduct rows (up to 40)</p>
                      </div>
                      <div className="flex items-center gap-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Rows:</span>
                          <input 
                            type="number"
                            value={newAssignOrders.length}
                            onChange={(e) => handleOrderCountChange(e.target.value)}
                            required
                            min="1"
                            max="40"
                            className="w-20 h-11 px-3 text-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none shadow-2xs"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={handleAddOrder}
                          className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-sm cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Add Row
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sequence Preview or Configuration Cards Container */}
                  {selectedTemplate !== 'custom' && !isCustomizingPreset ? (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-2.5"><ListOrdered className="w-4 h-4 text-indigo-500" /> Worksheet Sequence Preview</span>
                        <div className="flex items-center gap-3.5">
                          <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3.5 py-1 rounded-full text-xs font-bold">{newAssignOrders.length} Items</span>
                          <button
                            type="button"
                            onClick={() => setIsCustomizingPreset(true)}
                            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Customize Preset Rows
                          </button>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-200 dark:border-slate-800">
                            <tr className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              <th className="px-6 py-4.5 w-24 text-center">Sr.</th>
                              <th className="px-6 py-4.5">Product Title</th>
                              <th className="px-6 py-4.5 text-right">Price</th>
                              <th className="px-6 py-4.5 text-right">Commission</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {newAssignOrders.map((o, oIdx) => (
                              <tr key={oIdx} className={`hover:bg-slate-50/80 dark:hover:bg-slate-950/50 transition-colors ${freezeTarget === String(oIdx + 1) ? 'bg-rose-50/60 dark:bg-rose-950/30' : ''}`}>
                                <td className="px-6 py-4.5 text-center text-xs text-slate-600 dark:text-slate-400 font-mono font-bold align-middle">
                                  <span className="block text-sm font-bold">{oIdx + 1}</span>
                                  {freezeTarget === String(oIdx + 1) && (
                                    <span className="mt-1 px-2.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 font-extrabold uppercase text-[10px] inline-block shadow-2xs border border-rose-200 dark:border-rose-800/50">
                                      Freeze
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4.5 align-middle">
                                  <div className="flex items-center gap-4 my-1">
                                    {o.image ? (
                                      <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-white p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
                                        <img 
                                          src={o.image} 
                                          alt="" 
                                          referrerPolicy="no-referrer"
                                          className="max-w-full max-h-full object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold">
                                        #{oIdx + 1}
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-normal max-w-lg block truncate" title={o.title}>
                                        {o.title}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4.5 text-right font-mono font-bold text-sm text-slate-900 dark:text-slate-100 align-middle tabular-nums">$ {safeFloat(o.price).toFixed(2)}</td>
                                <td className="px-6 py-4.5 text-right font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 align-middle tabular-nums">$ {safeFloat(o.profit).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {selectedTemplate !== 'custom' && isCustomizingPreset && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-700 dark:text-indigo-300">
                          <span>You are customizing rows for preset <b>{currentPreset.name}</b>. Any changes will apply to this allocation.</span>
                          <button
                            type="button"
                            onClick={() => setIsCustomizingPreset(false)}
                            className="text-xs font-bold underline cursor-pointer"
                          >
                            Return to Table View
                          </button>
                        </div>
                      )}
                      {newAssignOrders.map((order, idx) => (
                        <div 
                          key={idx} 
                          className={`bg-white dark:bg-slate-950 border ${freezeTarget === String(idx + 1) ? 'border-rose-400 dark:border-rose-500/50 shadow-rose-500/10' : 'border-slate-200 dark:border-slate-800'} rounded-2xl shadow-sm relative group transition-all flex flex-col gap-6 p-6 sm:p-7`}
                        >
                          {/* Order Header / Actions */}
                          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/60">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                                {idx + 1}
                              </div>
                              Worksheet Order Row
                              {freezeTarget === String(idx + 1) && (
                                <span className="ml-2 px-2.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 font-bold border border-rose-200 dark:border-rose-800/40">Target Freeze</span>
                              )}
                            </span>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setFreezeTarget(freezeTarget === String(idx + 1) ? '' : String(idx + 1))}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                                  freezeTarget === String(idx + 1)
                                    ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:border-rose-800 dark:text-rose-300'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {freezeTarget === String(idx + 1) ? '★ Target Freeze' : 'Set as Freeze'}
                              </button>
                              {newAssignOrders.length > 1 && (
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveOrder(idx)}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-lg transition-colors cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-end">
                            {/* Auto-Fill Catalog */}
                            <div className="md:col-span-4 flex flex-col gap-2">
                              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Auto-Fill Catalog</label>
                              <select
                                onChange={(e) => {
                                  if (e.target.value !== "") {
                                    const prod = products[parseInt(e.target.value)];
                                    const updated = [...newAssignOrders];
                                    updated[idx] = {
                                      ...updated[idx],
                                      title: prod.title,
                                      image: prod.image,
                                      price: String(prod.price),
                                      profit: String(prod.profit || (prod.price * 0.1).toFixed(2))
                                    };
                                    setNewAssignOrders(updated);
                                  }
                                }}
                                defaultValue=""
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-colors cursor-pointer"
                              >
                                <option value="">-- Choose Product --</option>
                                {products.map((p, pIdx) => (
                                  <option key={pIdx} value={pIdx}>
                                    {p.title.length > 40 ? p.title.substring(0, 40) + '...' : p.title} (${p.price})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Product Title */}
                            <div className="md:col-span-8 flex gap-3.5 items-end">
                              {order.image && (
                                <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white shadow-xs p-1.5 flex-shrink-0 flex items-center justify-center">
                                  <img 
                                    src={order.image} 
                                    alt="" 
                                    referrerPolicy="no-referrer"
                                    className="max-w-full max-h-full object-contain"
                                  />
                                </div>
                              )}
                              <div className="flex-1 flex flex-col gap-2">
                                <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Product Title</label>
                                <input 
                                  type="text"
                                  value={order.title}
                                  onChange={(e) => {
                                    const updated = [...newAssignOrders];
                                    updated[idx].title = e.target.value;
                                    setNewAssignOrders(updated);
                                  }}
                                  required
                                  placeholder="e.g. Premium Item Title"
                                  className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Price & Commission row */}
                          <div className="pt-5 border-t border-slate-100 dark:border-slate-800/40 grid grid-cols-2 gap-5">
                            <div className="flex flex-col gap-2">
                              <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Price ($)</label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-bold">$</span>
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={order.price}
                                  onChange={(e) => {
                                    const updated = [...newAssignOrders];
                                    const newPrice = e.target.value;
                                    updated[idx].price = newPrice;
                                    const numP = safeFloat(newPrice);
                                    if (numP > 0 && (!order.profit || order.profit === '0' || order.profit === '10')) {
                                      updated[idx].profit = (numP * 0.1).toFixed(2);
                                    }
                                    setNewAssignOrders(updated);
                                  }}
                                  required
                                  placeholder="0.00"
                                  className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider block">Commission ($)</label>
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-emerald-500 font-bold">$</span>
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={order.profit}
                                  onChange={(e) => {
                                    const updated = [...newAssignOrders];
                                    updated[idx].profit = e.target.value;
                                    setNewAssignOrders(updated);
                                  }}
                                  required
                                  placeholder="0.00"
                                  className="w-full h-12 pl-8 pr-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Computation Summary block */}
                  <div className="bg-slate-50 dark:bg-slate-900/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                    <div className="grid grid-cols-3 gap-5 text-center">
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Total Items</span>
                        <b className="text-slate-900 dark:text-slate-100 text-base font-mono">{newAssignOrders.length}</b>
                      </div>
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Total Price</span>
                        <b className="text-slate-900 dark:text-slate-100 text-sm font-mono truncate block">${newAssignOrders.reduce((sum, o) => sum + safeFloat(o.price), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                      </div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-2">Total Commission</span>
                        <b className="text-emerald-700 dark:text-emerald-400 text-sm font-mono truncate block">${newAssignOrders.reduce((sum, o) => sum + safeFloat(o.profit), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3" style={{ padding: '20px 32px' }}>
                  <button 
                    type="button" 
                    className="px-5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-colors shadow-sm"
                    onClick={() => { setShowModal(false); setSelectedUser(null); }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-[0.98]"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Review & Allocate Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Confirmation Dialog for Task Creation by Admins */}
      {showConfirmModal && pendingTaskData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 transition-all">
          <div className="bg-white dark:bg-slate-950 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Confirmation Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Confirm Task Creation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Please review task allocation before assigning to user</p>
                </div>
              </div>
              <button 
                type="button"
                disabled={isSubmittingTask}
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Confirmation Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Target User Details */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                    {pendingTaskData.user.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">@{pendingTaskData.user.username}</span>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        Level {pendingTaskData.user.level || 1}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: {pendingTaskData.user.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Current Balance</span>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ${parseFloat(pendingTaskData.user.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* 4 Metrics Highlight Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 my-2">
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Orders</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono">{pendingTaskData.orderCount}</span>
                </div>
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block">Total Price</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono truncate max-w-full">
                    ${pendingTaskData.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 sm:p-5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 text-center shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Commission</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-700 dark:text-emerald-300 font-mono truncate max-w-full">
                    ${pendingTaskData.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 sm:p-5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 text-center shadow-xs flex flex-col items-center justify-center gap-1.5 transition-all">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Yield</span>
                  <span className="text-base sm:text-lg font-bold text-indigo-700 dark:text-indigo-300 font-mono">
                    {pendingTaskData.profitPercent}%
                  </span>
                </div>
              </div>

              {/* Task Details Summary */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3.5 text-xs sm:text-sm shadow-xs">
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Selected Template:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    {pendingTaskData.templateName}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {pendingTaskData.templateBadge}
                    </span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Freeze Row Configuration:</span>
                  <span className={`font-semibold ${pendingTaskData.freezeTarget ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                    {pendingTaskData.freezeTarget ? `Order #${pendingTaskData.freezeTarget} (Target Freeze)` : 'None (Standard Flow)'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Admin Assignee:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{pendingTaskData.task.assigned_by}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Task Identifier:</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{pendingTaskData.task.id}</span>
                </div>
              </div>

              {/* Full order queue preview */}
              <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-sm">
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center text-slate-600 dark:text-slate-400 text-xs">
                  <span className="font-bold text-[10px] uppercase tracking-wider">All Queue Orders</span>
                  <span className="text-[11px] font-mono">{pendingTaskData.orders.length} total rows</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pendingTaskData.orders.map((o, idx) => (
                    <div key={idx} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <div className="flex min-w-0 flex-1 items-start gap-2 pr-3">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold font-mono">
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1 whitespace-normal break-words font-medium text-slate-800 dark:text-slate-200" title={o.title}>
                          {o.title}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 font-mono text-right">
                        <span className="text-slate-500">${o.price.toFixed(2)}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">+${o.profit.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Informational Callout */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  Upon confirmation, task <strong className="font-semibold">{pendingTaskData.task.id}</strong> and all <strong className="font-semibold">{pendingTaskData.orderCount} orders</strong> will be created in <strong className="font-semibold">Pending</strong> status and will become immediately available in user <strong className="font-semibold">{pendingTaskData.user.username}</strong>'s task queue.
                </p>
              </div>
            </div>

            {/* Confirmation Footer */}
            <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-900/70 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 items-center">
              <button
                type="button"
                disabled={isSubmittingTask}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                Back to Edit
              </button>
              <button
                type="button"
                disabled={isSubmittingTask}
                onClick={handleFinalizeAssignment}
                className="px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isSubmittingTask ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Task...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Create Task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Edit Worksheet Orders Modal */}
      {showEditOrdersModal && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 transition-all">
          <div className="bg-white dark:bg-slate-950 w-full max-w-6xl overflow-hidden flex flex-col h-[90dvh] max-h-[900px] min-h-0 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between flex-shrink-0 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-100 dark:border-indigo-800/30">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-xl tracking-tight">Edit Worksheet Orders</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Modifying task <span className="font-mono font-bold text-indigo-600">#{editingTask.id}</span> for <span className="font-semibold">{editingTask.username}</span></p>
                </div>
              </div>
              <button 
                type="button"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                onClick={() => { setShowEditOrdersModal(false); setEditingTask(null); }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Changes made here will update both the worksheet sequence and any individual pending order records. Completed orders will not be affected.</span>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {editingOrders.map((order, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col gap-6 p-6 sm:p-7 relative transition-all"
                  >
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
                          {idx + 1}
                        </div>
                        Order Item
                        {order.status === 'Success' && (
                          <span className="ml-2 px-2.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/40">Completed</span>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Product Title</label>
                          <input 
                            type="text"
                            value={order.title}
                            onChange={(e) => {
                              const updated = [...editingOrders];
                              updated[idx].title = e.target.value;
                              setEditingOrders(updated);
                            }}
                            disabled={order.status === 'Success'}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none transition-colors disabled:opacity-50"
                            placeholder="Enter product title..."
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Image URL</label>
                          <input 
                            type="text"
                            value={order.image || ''}
                            onChange={(e) => {
                              const updated = [...editingOrders];
                              updated[idx].image = e.target.value;
                              setEditingOrders(updated);
                            }}
                            disabled={order.status === 'Success'}
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-colors disabled:opacity-50"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Price ($)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400 font-bold">$</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={order.price}
                              onChange={(e) => {
                                const updated = [...editingOrders];
                                updated[idx].price = e.target.value;
                                setEditingOrders(updated);
                              }}
                              disabled={order.status === 'Success'}
                              className="w-full h-12 pl-8 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-colors disabled:opacity-50"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider block">Profit ($)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-emerald-500 font-bold">$</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={order.profit}
                              onChange={(e) => {
                                const updated = [...editingOrders];
                                updated[idx].profit = e.target.value;
                                setEditingOrders(updated);
                              }}
                              disabled={order.status === 'Success'}
                              className="w-full h-12 pl-8 pr-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-colors disabled:opacity-50"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">Commission ($)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-indigo-500 font-bold">$</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={order.commission !== undefined ? order.commission : (parseFloat((Number(order.profit || 0) * 0.1).toFixed(2)))}
                              onChange={(e) => {
                                const updated = [...editingOrders];
                                updated[idx].commission = e.target.value;
                                setEditingOrders(updated);
                              }}
                              disabled={order.status === 'Success'}
                              className="w-full h-12 pl-8 pr-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-colors disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 px-8 py-5">
              <button 
                type="button"
                className="px-5 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-colors shadow-sm"
                onClick={() => { setShowEditOrdersModal(false); setEditingTask(null); }}
              >
                Discard Changes
              </button>
              <button 
                type="button"
                onClick={handleSaveEditedOrders}
                className="px-6 h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                Save worksheet Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
