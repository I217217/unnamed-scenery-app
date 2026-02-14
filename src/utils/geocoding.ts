const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=place,country,region&language=ja,en&access_token=${MAPBOX_TOKEN}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Geocoding failed');
        }
        const data = await response.json();

        // Parse features to find relevant place and country
        // Mapbox usually returns features sorted by relevance (most specific first)
        // We want something like "City, Country" or "Region, Country"

        const features = data.features;
        if (!features || features.length === 0) return '';

        let place = '';
        let region = '';
        let country = '';

        features.forEach((f: any) => {
            if (f.place_type.includes('place')) place = f.text;
            if (f.place_type.includes('region')) region = f.text;
            if (f.place_type.includes('country')) country = f.text;
        });

        // Construct string
        // Priority: Place -> Region (if no place)
        const localPart = place || region;

        if (localPart && country) {
            return `${localPart}, ${country}`;
        } else if (country) {
            return country;
        } else {
            return localPart;
        }

    } catch (error) {
        console.error("Reverse geocoding error:", error);
        return '';
    }
};
