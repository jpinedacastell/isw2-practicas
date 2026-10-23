app.use(async (req, res, next) => {
    if (!req.session.usuario_id) {
        res.locals.esPremium = false;
        res.locals.userLogo = '/images/logo.png'; // Logo por defecto
        res.locals.whatsappStatus = 'DISCONNECTED';
        return next();
    }

    const userId = req.session.usuario_id;

    try {
        const [user] = await db.query('SELECT suscripcion FROM usuarios_reseller WHERE id = ?', [userId]);
        const [configReseller] = await db.query('SELECT logo_empresa FROM configuraciones_reseller WHERE user_id = ?', [userId]);

        res.locals.esPremium = user.length > 0 && user[0].suscripcion === 'pago';
        res.locals.userLogo = (res.locals.esPremium && configReseller.length > 0 && configReseller[0].logo_empresa) 
            ? `${configReseller[0].logo_empresa}` 
            : '/images/logo.png'; // Si no tiene logo, usa el de la app

        const whatsappStatus = await getEstadoCliente(userId);
        res.locals.whatsappStatus = whatsappStatus;

    } catch (error) {
        console.error('Error al cargar datos del usuario en middleware:', error);
        res.locals.esPremium = false;
        res.locals.userLogo = '/images/logo.png';
        res.locals.whatsappStatus = 'DISCONNECTED';
    }

    next();
});

#1. Codigo duplicado, ejemplo userLogo, esPremium
#2. No se estan defiendo variables, ya que tambien se repiten Ejm. pago, DISCONNECTED
#3. Redundancia en codigo y comentarios



const DEFAULT_LOGO = '/images/logo.png';
const SUSCRIPCION_PAGO = 'pago';
const WHATSAPP_DESCONECTADO = 'DISCONNECTED';

// Definicion de variables y asignacion de valores por default
const defaultLocals = () => ({
    esPremium: false,
    userLogo: DEFAULT_LOGO,
    whatsappStatus: WHATSAPP_DESCONECTADO,
});

// Obtener logo del reseller si su suscripcion es de pago
async function obtenerBranding(userId) {
    const [rows] = await db.query(
        `SELECT u.suscripcion, c.logo_empresa
           FROM usuarios_reseller u
      LEFT JOIN configuraciones_reseller c ON c.user_id = u.id
          WHERE u.id = ?`,
        [userId]
    );
    if (rows.length === 0) return null;

    const esPremium = rows[0].suscripcion === SUSCRIPCION_PAGO;
    return {
        esPremium,
        userLogo: (esPremium && rows[0].logo_empresa) || DEFAULT_LOGO,
    };
}

// Exportamos el estado inicial del reseller con su logo y conexion de WhatsApp
app.use(async (req, res, next) => {
    Object.assign(res.locals, defaultLocals());

    const userId = req.session.usuario_id;
    if (!userId) return next();

    const [branding, whatsapp] = await Promise.allSettled([
        obtenerBranding(userId),
        getEstadoCliente(userId),
    ]);

    if (branding.status === 'fulfilled' && branding.value) {
        Object.assign(res.locals, branding.value);
    } else if (branding.status === 'rejected') {
        logger.error('Error cargando branding', branding.reason);
    }

    if (whatsapp.status === 'fulfilled') {
        res.locals.whatsappStatus = whatsapp.value;
    } else {
        logger.error('Error obteniendo estado de WhatsApp', whatsapp.reason);
    }

    next();
});