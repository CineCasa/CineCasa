import React from 'react';
import { User } from 'lucide-react';

interface CastMember {
  id: string;
  name: string;
  character?: string;
  profile_path?: string;
}

interface CastSectionProps {
  cast: CastMember[];
}

const CastSection: React.FC<CastSectionProps> = ({ cast }) => {
  if (!cast || cast.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Elenco</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {cast.map((member) => (
          <div key={member.id} className="flex-shrink-0 w-24 text-center">
            <div className="aspect-square rounded-full overflow-hidden bg-gray-800 mb-2">
              {member.profile_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w200${member.profile_path}`}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <p className="text-sm font-medium truncate">{member.name}</p>
            {member.character && (
              <p className="text-xs text-gray-400 truncate">{member.character}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CastSection;
