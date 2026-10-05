import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage } from '@/components/LegalPage';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'Aviso de privacidad', description: `Aviso de privacidad de ${site.name}: qué datos tratamos, para qué y cómo ejercer tus derechos.` };

export default function PrivacyNoticePage() {
  const { legal } = site;
  return (
    <LegalPage title="Aviso de privacidad" intro={`${legal.entityName} (“el Despacho”) te informa de forma resumida cómo trata tus datos personales cuando usas esta plataforma. Para el detalle completo consulta la Política de privacidad.`}>
      <h2 id="responsable">Responsable</h2>
      <p><strong>{legal.entityName}</strong>{legal.address ? <>, con domicilio en {legal.address}</> : null}. Atendemos a clientes de toda Latinoamérica desde Miami, por lo que <strong>tus datos se tratan y almacenan en Estados Unidos</strong>. Para cualquier asunto sobre tus datos escríbenos a <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.</p>

      <h2 id="datos">Datos que tratamos</h2>
      <ul>
        <li><strong>Identificación y contacto:</strong> nombre, correo electrónico, cédula o documento de identidad, teléfono, dirección y ciudad.</li>
        <li><strong>Datos financieros:</strong> banco, tipo y número de cuenta, montos de tus solicitudes de desembolso y, si participas, de tus inversiones.</li>
        <li><strong>Documentos que cargas:</strong> identidad, soportes bancarios, documentos legales y comprobantes.</li>
        <li><strong>Información de tu caso</strong> y de tu actividad en la plataforma (estados, novedades, alertas).</li>
        <li><strong>Datos técnicos de seguridad:</strong> dirección IP y navegador en los registros de acceso y auditoría.</li>
      </ul>

      <h2 id="finalidades">Para qué los usamos</h2>
      <ul>
        <li>Prestarte servicios jurídicos de recuperación de capital y gestionar tu caso.</li>
        <li>Verificar tu identidad y validar tus documentos.</li>
        <li>Tramitar y dar seguimiento a tus solicitudes de desembolso y, en su caso, a tus inversiones.</li>
        <li>Enviarte alertas sobre tus documentos, solicitudes, casos y oportunidades.</li>
        <li>Proteger la seguridad de la plataforma, prevenir fraudes y cumplir obligaciones legales.</li>
      </ul>

      <h2 id="sensibles">Datos financieros y consentimiento</h2>
      <p>Tratamos tus datos financieros y de identidad únicamente para las finalidades anteriores. Al marcar la casilla de aceptación al crear tu cuenta, nos das tu <strong>consentimiento expreso</strong> para ese tratamiento. Guardamos la fecha y la versión del aviso que aceptaste. Puedes <strong>retirar tu consentimiento</strong> en cualquier momento escribiendo a <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>; ten en cuenta que, sin ciertos datos, no podremos seguir prestándote el servicio.</p>
      <p>Tu cédula y el número de tu cuenta bancaria se almacenan <strong>cifrados</strong>, y los accesos del personal a esos datos quedan registrados.</p>

      <h2 id="terceros">Con quién los compartimos</h2>
      <p>No vendemos tus datos personales. Solo los compartimos con proveedores que nos prestan servicios técnicos y con entidades necesarias para ejecutar tu solicitud (por ejemplo, la entidad bancaria de un desembolso), así como con autoridades cuando la ley lo exija o con las contrapartes y juzgados que tu caso requiera. Más detalle en la Política de privacidad.</p>

      <h2 id="derechos">Tus derechos</h2>
      <p>Puedes solicitar <strong>acceso, rectificación, actualización o supresión</strong> de tus datos, <strong>oponerte</strong> o pedir la <strong>limitación</strong> de su tratamiento, y solicitar su <strong>portabilidad</strong>, en los términos que permita la normativa aplicable. Escribe a <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a> indicando tu nombre y qué deseas; podremos pedirte verificar tu identidad.</p>

      <h2 id="mas">Más información</h2>
      <p>Lee la <Link href="/privacidad">Política de privacidad completa</Link> para conocer las medidas de seguridad, los plazos de conservación, el uso de cookies y cómo actualizamos este aviso.</p>
    </LegalPage>
  );
}
