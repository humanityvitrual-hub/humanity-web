export default function AvatarAssistant() {
  return (
    <div className="mt-8 flex flex-col items-center text-white text-lg">
      <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center mb-4">
        🤖
      </div>
      <p className="text-center">
        ¿Qué estás buscando hoy?<br />
        <strong>Productos</strong>, <strong>Servicios</strong> o <strong>Conocimiento</strong>
      </p>
    </div>
  );
}
