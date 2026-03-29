# MongoDB Schema: Smart Farm Management

This schema defines how crop data, irrigation thresholds, and plot management are handled in the Smart Farm project.

## 1. Crop Thresholds (Automated Irrigation)
Previously hardcoded in `server.js`, these are now stored in the database to allow dynamic updates.

| Collection | Field | Type | Required | Unique |
| :--- | :--- | :--- | :--- | :--- |
| `CropThresholds` | `cropName` | `String` | Yes | Yes |
| | `startThreshold` | `Number` | Yes | - |
| | `stopThreshold` | `Number` | Soil moisture % above which irrigation should stop. |

---

## 2. Crop Master Blueprints (`CropMasters`)
Stores "blueprints" for crops. This eliminates hardcoded naming/description logic.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | `String` | Official name (e.g. "Basmati Rice"). |
| `category` | `String` | Type: `Vegetable`, `Fruit`, `Grain`, `Spice`, `Tuber`. |
| `description`| `String` | Default marketing description for the crop. |
| `basePrice` | `Number` | Suggested starting price. |

---

## 3. Crops (Marketplace)
Used for listing products for buyers.

| Collection | Field | Type | Description |
| :--- | :--- | :--- | :--- |
| `Crops` | `name` | `String` | Product title. |
| | `category` | `String` | Inherited from blueprint. |
| | `unit` | `String` | Default is `kg`. |
| | `price` | `Number` | Price per unit. |
| | `quantity` | `Number` | Stock in units. |
| | `farmerId` | `ObjectId` | Ref to `User`. |

---

## 4. Plots (Field Management)
Maps physical fields to ESP devices and active thresholds.

| Collection | Field | Type | Description |
| :--- | :--- | :--- | :--- |
| `Plots` | `name` | `String` | Field name. |
| | `deviceId` | `String` | Unique ESP ID. |
| | `startThreshold`| `Number` | Current active lower bound. |
| | `stopThreshold` | `Number` | Current active upper bound. |

---

## 5. Orders (Marketplace)
Tracks purchase history and payment status.

| Collection | Field | Type | Description |
| :--- | :--- | :--- | :--- |
| `Orders` | `buyerId` | `ObjectId` | Ref to `User`. |
| | `items` | `Array` | List of items `{ cropId, quantity }`. |
| | `paymentStatus` | `String` | `pending` or `completed`. |
