-- Add geospatial support to gyms
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Update existing mocks with approximate coordinates (e.g. Mumbai/Bangalore based on previous logs)
UPDATE gyms SET latitude = 12.9716, longitude = 77.5946 WHERE name = 'Flex Fitness';
UPDATE gyms SET latitude = 19.0760, longitude = 72.8777 WHERE name = 'Iron Paradise';
