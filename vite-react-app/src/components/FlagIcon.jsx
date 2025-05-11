import React from 'react';

const FlagIcon = ({ country, className = '' }) => {
    if (!country) return null;

    // Función para obtener código de país basado en el nombre
    const getCountryCode = (countryName) => {
        if (!countryName) return '';
        
        const countryMap = {
            'united states': 'us',
            'usa': 'us',
            'united states of america': 'us',
            'canada': 'ca',
            'mexico': 'mx',
            'united kingdom': 'gb',
            'great britain': 'gb',
            'germany': 'de',
            'france': 'fr',
            'spain': 'es',
            'italy': 'it',
            'china': 'cn',
            'japan': 'jp',
            'australia': 'au',
            'brazil': 'br',
            'argentina': 'ar',
            'russia': 'ru',
            'india': 'in',
            // Agrega más mapeos según sea necesario
        };
        
        const normalizedCountry = countryName.toLowerCase().trim();
        return countryMap[normalizedCountry] || '';
    };

    const countryCode = getCountryCode(country);

    if (!countryCode) {
        return <span className={className}>{country}</span>;
    }

    return (
        <div className={`flex items-center ${className}`}>
            <img 
                src={`https://flagcdn.com/16x12/${countryCode}.png`}
                srcSet={`https://flagcdn.com/32x24/${countryCode}.png 2x,
                         https://flagcdn.com/48x36/${countryCode}.png 3x`}
                alt={country}
                className="w-4 h-3 mr-2 object-cover"
                onError={(e) => {
                    e.target.style.display = 'none';
                }}
            />
            <span>{country}</span>
        </div>
    );
};

export default FlagIcon;