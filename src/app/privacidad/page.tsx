import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Política de privacidad', description: `Política de privacidad de ${site.name}: datos que recopilamos, finalidades, seguridad, conservación, cookies y derechos.` };

const TOC = [
  { id: 'responsable', label: 'Responsable del tratamiento' },
  { id: 'datos', label: 'Datos que recopilamos' },
  { id: 'finalidades', label: 'Para qué usamos tus datos' },
  { id: 'base', label: 'Fundamento y consentimiento' },
  { id: 'terceros', label: 'Con quién los compartimos' },
  { id: 'transferencias', label: 'Transferencias internacionales' },
  { id: 'seguridad', label: 'Cómo los protegemos' },
  { id: 'conservacion', label: 'Cuánto tiempo los conservamos' },
  { id: 'derechos', label: 'Tus derechos' },
  { id: 'cookies', label: 'Cookies y almacenamiento local' },
  { id: 'menores', label: 'Menores de edad' },
  { id: 'cambios', label: 'Cambios en esta política' },
  { id: 'contacto', label: 'Contacto' },
];

export default function PrivacyPolicyPage() {
  const { legal } = site;
  const mail = <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>;
  return (
    <LegalPage toc={TOC} title="Política de privacidad" intro={`En ${legal.entityName} (“el Despacho”) respetamos tu privacidad y el secreto profesional que rige la relación con nuestros clientes. Esta política explica qué datos personales tratamos en esta plataforma, para qué, cómo los protegemos y qué derechos tienes.`}>
      <h2 id="responsable">1. Responsable del tratamiento</h2>
      <p>El responsable del tratamiento de tus datos es <strong>{legal.entityName}</strong>{legal.address ? <>, con domicilio en {legal.address}</> : null}. Puedes contactarnos sobre privacidad en {mail}.</p>

      <h2 id="datos">2. Datos que recopilamos</h2>
      <table className="rtable">
        <thead><tr><th>Categoría</th><th>Ejemplos</th><th>Cómo los obtenemos</th></tr></thead>
        <tbody>
          <tr><td data-label="Categoría">Cuenta</td><td data-label="Ejemplos">Nombre, correo electrónico, contraseña (almacenada con hash, nunca en texto plano)</td><td data-label="Cómo los obtenemos">Tú, al registrarte o cuando el Despacho crea tu usuario</td></tr>
          <tr><td data-label="Categoría">Identificación y contacto</td><td data-label="Ejemplos">Cédula o documento de identidad, teléfono, dirección, ciudad</td><td data-label="Cómo los obtenemos">Tú, en tu perfil</td></tr>
          <tr><td data-label="Categoría">Datos financieros</td><td data-label="Ejemplos">Banco, tipo y número de cuenta, montos de solicitudes de desembolso e inversiones</td><td data-label="Cómo los obtenemos">Tú, en tu perfil y solicitudes; el Despacho al registrar operaciones</td></tr>
          <tr><td data-label="Categoría">Documentos</td><td data-label="Ejemplos">Documentos de identidad, bancarios, legales y comprobantes</td><td data-label="Cómo los obtenemos">Los cargas tú</td></tr>
          <tr><td data-label="Categoría">Caso y actividad</td><td data-label="Ejemplos">Etapas, novedades, documentos requeridos, alertas y su estado de lectura</td><td data-label="Cómo los obtenemos">Generados por el Despacho y por tu uso de la plataforma</td></tr>
          <tr><td data-label="Categoría">Seguridad</td><td data-label="Ejemplos">Dirección IP y navegador asociados a inicios de sesión y a acciones registradas en auditoría</td><td data-label="Cómo los obtenemos">Automáticamente al usar la plataforma</td></tr>
        </tbody>
      </table>
      <p>No te pedimos datos que no necesitemos para las finalidades descritas.</p>

      <h2 id="finalidades">3. Para qué usamos tus datos</h2>
      <ul>
        <li>Prestarte los servicios jurídicos contratados y gestionar tu caso de recuperación de capital.</li>
        <li>Verificar tu identidad y validar los documentos que cargas.</li>
        <li>Tramitar y dar seguimiento a tus solicitudes de desembolso y, cuando corresponda, a tus inversiones y su valoración.</li>
        <li>Comunicarte cambios relevantes mediante alertas dentro de la plataforma (documentos, solicitudes, casos, oportunidades).</li>
        <li>Garantizar la seguridad de la plataforma, detectar y prevenir fraudes o usos indebidos.</li>
        <li>Cumplir obligaciones legales, regulatorias y de conservación, y atender requerimientos de autoridades.</li>
        <li>Elaborar estadísticas internas agregadas que no te identifican, para mejorar el servicio.</li>
      </ul>

      <h2 id="base">4. Fundamento y consentimiento</h2>
      <p>Tratamos tus datos para ejecutar la relación de servicios contigo, para cumplir obligaciones legales, por el interés legítimo en la seguridad de la plataforma y, en el caso de los datos financieros y de identidad, con tu <strong>consentimiento expreso</strong>, que otorgas al marcar la casilla de aceptación al registrarte. Conservamos constancia de la <strong>fecha y de la versión</strong> del aviso y la política que aceptaste.</p>
      <p>Puedes <strong>retirar tu consentimiento</strong> en cualquier momento escribiendo a {mail}. El retiro no afecta la licitud del tratamiento previo y puede impedirnos continuar prestando el servicio o requerir la conservación de ciertos datos por obligación legal.</p>

      <h2 id="terceros">5. Con quién compartimos tus datos</h2>
      <p><strong>No vendemos ni alquilamos tus datos personales.</strong> Podemos compartirlos solo en estos casos:</p>
      <ul>
        <li><strong>Proveedores tecnológicos</strong> (alojamiento, base de datos y almacenamiento de archivos) que tratan datos por nuestra cuenta, bajo obligaciones de confidencialidad y seguridad.</li>
        <li><strong>Entidades financieras</strong>, cuando sea necesario para ejecutar un desembolso que solicitaste.</li>
        <li><strong>Contrapartes, juzgados, notarías u otras autoridades</strong> en la medida que lo requiera la gestión de tu caso.</li>
        <li><strong>Autoridades competentes</strong>, cuando una norma o una orden válida nos obligue.</li>
      </ul>
      <p>Dentro del Despacho, el acceso se limita al personal que lo necesita según su función, y las consultas a datos personales quedan registradas.</p>

      <h2 id="transferencias">6. Transferencias internacionales</h2>
      <p>Algunos proveedores pueden tratar datos en servidores ubicados fuera de tu país de residencia. Cuando eso ocurra, exigiremos garantías contractuales y técnicas razonables para proteger tus datos de forma equivalente a esta política y a la normativa aplicable.</p>

      <h2 id="seguridad">7. Cómo protegemos tus datos</h2>
      <ul>
        <li><strong>Cifrado en reposo</strong> de tu cédula y del número de tu cuenta bancaria (AES-256); a ti solo te mostramos los últimos cuatro dígitos de la cuenta.</li>
        <li><strong>Contraseñas con hash</strong> seguro y sesiones protegidas con cookies que el navegador no expone a scripts (httpOnly) y que viajan solo por conexión cifrada en producción.</li>
        <li><strong>Control de acceso por roles</strong>: cada cliente solo puede ver su propia información.</li>
        <li><strong>Registro de auditoría</strong> de accesos del personal a datos personales, descargas de documentos y cambios de estado.</li>
        <li>Validación de los archivos que cargas y limitación de intentos de acceso para dificultar abusos.</li>
      </ul>
      <p>Ningún sistema es infalible. Si detectamos una brecha que afecte tus datos, te lo comunicaremos y notificaremos a las autoridades cuando la ley lo exija.</p>

      <h2 id="conservacion">8. Cuánto tiempo los conservamos</h2>
      <p>Conservamos tus datos mientras mantengamos una relación contigo y, después, durante los plazos que exijan la normativa aplicable, el deber de conservación de expedientes profesionales y la defensa frente a posibles reclamaciones. Cumplido ese plazo, los eliminamos o los anonimizamos. Los registros de auditoría se conservan el tiempo necesario para fines de seguridad y cumplimiento.</p>

      <h2 id="derechos">9. Tus derechos</h2>
      <p>Según la normativa aplicable, puedes:</p>
      <ul>
        <li><strong>Acceder</strong> a tus datos y conocer cómo los tratamos.</li>
        <li><strong>Rectificar o actualizar</strong> datos inexactos o incompletos (puedes editar gran parte de ellos en <em>Mi perfil</em>).</li>
        <li><strong>Solicitar la supresión</strong> cuando ya no sean necesarios, salvo que debamos conservarlos por obligación legal o profesional.</li>
        <li><strong>Oponerte</strong> a ciertos tratamientos o pedir su <strong>limitación</strong>.</li>
        <li><strong>Solicitar la portabilidad</strong> de los datos que nos facilitaste.</li>
        <li><strong>Retirar tu consentimiento</strong> y <strong>presentar un reclamo</strong> ante la autoridad de protección de datos de tu país.</li>
      </ul>
      <p>Para ejercerlos escribe a {mail} indicando tu nombre, el derecho que deseas ejercer y los datos relevantes. Podremos pedirte que verifiques tu identidad. Responderemos dentro de los plazos que establezca la ley aplicable.</p>

      <h2 id="cookies">10. Cookies y almacenamiento local</h2>
      <p>Usamos únicamente elementos <strong>estrictamente necesarios</strong>. No usamos cookies publicitarias ni herramientas de analítica o seguimiento de terceros.</p>
      <table className="rtable">
        <thead><tr><th>Nombre</th><th>Finalidad</th><th>Duración</th></tr></thead>
        <tbody>
          <tr><td data-label="Nombre"><code>ilg_at</code> (cookie)</td><td data-label="Finalidad">Mantener tu sesión iniciada</td><td data-label="Duración">Hasta 7 días</td></tr>
          <tr><td data-label="Nombre"><code>ilg_rt</code> (cookie)</td><td data-label="Finalidad">Renovar tu sesión de forma segura</td><td data-label="Duración">Hasta 7 días</td></tr>
          <tr><td data-label="Nombre"><code>theme</code> (almacenamiento local)</td><td data-label="Finalidad">Recordar si prefieres tema claro u oscuro</td><td data-label="Duración">Hasta que lo borres</td></tr>
        </tbody>
      </table>
      <p>Al ser necesarias para que la plataforma funcione, no pueden desactivarse desde aquí; puedes borrarlas desde tu navegador, lo que cerrará tu sesión.</p>

      <h2 id="menores">11. Menores de edad</h2>
      <p>Esta plataforma está dirigida a personas mayores de edad. No recopilamos de forma intencional datos de menores; si detectamos que lo hemos hecho, los eliminaremos.</p>

      <h2 id="cambios">12. Cambios en esta política</h2>
      <p>Podemos actualizar esta política para reflejar cambios en el servicio o en la ley. Publicaremos la nueva versión con su fecha y, si el cambio es sustancial, te lo avisaremos por la plataforma. La versión vigente es la <strong>{legal.privacyVersion}</strong>.</p>

      <h2 id="contacto">13. Contacto</h2>
      <p>Dudas, solicitudes o reclamos sobre privacidad: {mail}{legal.address ? <> · {legal.address}</> : null}. También puedes consultar el <Link href="/aviso-de-privacidad">Aviso de privacidad</Link> resumido.</p>
    </LegalPage>
  );
}
