import React from 'react';

export const WhatsAppFloat: React.FC = () => {
  return (
    <a
      href="https://wa.me/919284118601?text=Hi%20SM%203D!%20I'd%20like%20to%20discuss%20a%20custom%203D%20print%20design."
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition duration-300 group"
      title="Discuss Design on WhatsApp"
      aria-label="Chat on WhatsApp"
    >
      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-1.127-.061-.634-.204-1.464-.537-2.518-1.591-1.309-1.309-1.849-2.614-1.956-2.905-.108-.291-.012-.449.122-.594.133-.144.291-.351.436-.525.144-.174.19-.297.291-.497.098-.201.049-.374-.025-.523-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.416-.272z" />
      </svg>
      <span className="absolute right-14 bg-gray-900 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-gray-700 shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
        Chat on WhatsApp
      </span>
    </a>
  );
};
export default WhatsAppFloat;
