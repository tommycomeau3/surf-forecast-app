# Surf Spots Database

This document provides information about the surf spots available in the surf forecast app.

## Current Surf Spots (49 total)

### Northern California (7 spots)
- Ocean Beach - Beach Break (Intermediate)
- Mavericks - Reef Break (Advanced)
- Santa Cruz - Steamer Lane - Point Break (Intermediate)
- Pacifica - Linda Mar - Beach Break (Beginner)
- Half Moon Bay - Beach Break (Intermediate)
- Bolinas - Beach Break (Intermediate)
- Pleasure Point - Reef Break (Intermediate)

### Central California (6 spots)
- Morro Bay - Beach Break (Beginner)
- Pismo Beach - Beach Break (Beginner)
- Jalama Beach - Beach Break (Intermediate)
- Cayucos - Beach Break (Beginner)
- Avila Beach - Beach Break (Beginner)
- Surf Beach - Beach Break (Intermediate)

### Southern California (13 spots)
- Malibu - Surfrider Beach - Point Break (Intermediate)
- Manhattan Beach - Beach Break (Beginner)
- Huntington Beach - Beach Break (Beginner)
- Trestles - Point Break (Intermediate)
- La Jolla - Windansea - Reef Break (Advanced)
- Swamis - Reef Break (Intermediate)
- Venice Beach - Beach Break (Beginner)
- El Segundo - Beach Break (Beginner)
- Redondo Beach - Beach Break (Beginner)
- Palos Verdes - Reef Break (Advanced)
- San Onofre - Beach Break (Beginner)
- Cardiff Reef - Reef Break (Intermediate)
- Blacks Beach - Beach Break (Advanced)

### Hawaii (7 spots)
- Pipeline - Reef Break (Advanced)
- Waikiki - Reef Break (Beginner)
- Sunset Beach - Beach Break (Advanced)
- Hanauma Bay - Reef Break (Intermediate)
- Makaha - Beach Break (Intermediate)
- Haleiwa - Reef Break (Intermediate)
- Honolua Bay - Reef Break (Advanced)

### Oregon (4 spots)
- Cannon Beach - Beach Break (Intermediate)
- Lincoln City - Beach Break (Beginner)
- Newport - Beach Break (Intermediate)
- Seaside - Beach Break (Beginner)

### Washington (2 spots)
- Westport - Beach Break (Intermediate)
- La Push - Beach Break (Advanced)

### Florida (4 spots)
- Cocoa Beach - Beach Break (Beginner)
- New Smyrna Beach - Beach Break (Intermediate)
- Sebastian Inlet - Reef Break (Intermediate)
- Jacksonville Beach - Beach Break (Beginner)

### North Carolina (2 spots)
- Cape Hatteras - Beach Break (Intermediate)
- Wrightsville Beach - Beach Break (Beginner)

### New York (2 spots)
- Montauk - Beach Break (Intermediate)
- Rockaway Beach - Beach Break (Beginner)

### New Jersey (2 spots)
- Manasquan Inlet - Beach Break (Intermediate)
- Ocean City - Beach Break (Beginner)

## Break Types
- **Beach Break**: Waves break over sandy bottom
- **Reef Break**: Waves break over coral or rock reef
- **Point Break**: Waves break along a point of land

## Difficulty Levels
- **Beginner**: Suitable for new surfers
- **Intermediate**: Requires some surfing experience
- **Advanced**: For experienced surfers only

## Database Management

### Duplicate Prevention
The database now includes a unique constraint on the combination of `name` and `region` to prevent duplicate surf spots. The INSERT statements use `ON CONFLICT (name, region) DO NOTHING` to safely handle attempts to insert duplicate spots.

### Adding New Surf Spots
To add new surf spots to the database:

1. Edit `server/src/models/init.sql` and add new entries to the INSERT statement
2. Run the update script: `cd server && npm run update-spots`

### Update Script
The update script (`server/src/scripts/update-spots.js`) can be run to refresh the database with any new surf spots added to the init.sql file.

```bash
cd server
npm run update-spots
```

This script will:
- Insert any new surf spots from init.sql
- Show the total count of surf spots
- Display a breakdown by region

### Database Schema
Each surf spot has the following properties:
- `id`: Unique identifier
- `name`: Spot name
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `region`: Geographic region
- `break_type`: Type of wave break
- `difficulty_level`: Skill level required
- `created_at`: Timestamp when added
- `updated_at`: Timestamp when last modified