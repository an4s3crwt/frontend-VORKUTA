import React from "react";

const DataFilter = ({ selectedLetter, onSelectLetter }) => {
    const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

    return (
        <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600 mr-2">Filter:</span>
            {alphabet.map((letter) => (
                <button
                    key={letter}
                    onClick={() => onSelectLetter(letter)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium ${
                        selectedLetter === letter
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                    {letter}
                </button>
            ))}
        </div>
    );
};

export default DataFilter;