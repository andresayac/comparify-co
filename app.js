const { createBot, createProvider, createFlow, addKeyword } = require('@bot-whatsapp/bot')
const axios = require('axios')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')


let FILTER_APP = []
let STATE_APP = []

const flowSecundario = addKeyword(['2', 'siguiente']).addAnswer(['📄 Aquí tenemos el flujo secundario'])

const flowDocs = addKeyword(['doc', 'documentacion', 'documentación']).addAnswer(
    [
        '📄 Aquí encontras las documentación recuerda que puedes mejorarla',
        'https://bot-whatsapp.netlify.app/',
        '\n*2* Para siguiente paso.',
    ],
    null,
    null,
    [flowSecundario]
)


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const getFilter = async () => {
    try {
        const response = await axios.get(('https://comparador.crcom.gov.co/api/resources/filtros/data'))
        return response.data;
    } catch (error) {
        console.error(error);
        return [];
    }
}


const getList = async (filter) => {
    return filter.push("Volver al menú", "Detener");
}


function convertCamelCaseToSpaces(text) {
    return text
        .replace(/([A-Z])/g, ' $1') // inserta un espacio antes de los caracteres en mayúscula
        .replace(/^./, function (str) { return str.toUpperCase(); }) // convierte el primer carácter a mayúscula
}


const fetchData = async () => {
    const filterData = await getFilter()
    return filterData
}

FILTER_APP = fetchData()


// "TipoServicios":[
//     {
//     "name":"Telefonía móvil",
//     "code":1,
//     "filters":[
//     "TipoUsuario",
//     "Proveedores",
//     "Departamentos",
//     "Municipios",
//     "Estratos",
//     "Modalidad",
//     "ValorMensual",
//     "MinutosMismoDestino",
//     "MinutosOtroDestino",
//     "MinutosFijo",
//     "SMSMismoDestino",
//     "SMSOtroDestino"
//     ],
//     "id":"60917d0d3d14fc00203a1e05"
//     },
//     {
//     "name":"Internet móvil",
//     "code":2,
//     "filters":[
//     "TipoUsuario",
//     "Proveedores",
//     "Departamentos",
//     "Municipios",
//     "Estratos",
//     "Modalidad",
//     "ValorMensual",
//     "CantidadDatos"
//     ],
//     "id":"609dd5b7280d9930d0e31f9f"
//     },
//     {
//     "name":"Internet fijo",
//     "code":3,
//     "filters":[
//     "TipoUsuario",
//     "Proveedores",
//     "Departamentos",
//     "Municipios",
//     "Estratos",
//     "Modalidad",
//     "ValorMensual",
//     "TecnologiaUsadaIF",
//     "VelocidadSubida",
//     "VelocidadBajada"
//     ],
//     "id":"60917d2a3d14fc00203a1e06"
//     },
//     {
//     "name":"Telefonía fija",
//     "code":4,
//     "filters":[
//     "TipoUsuario",
//     "Proveedores",
//     "Departamentos",
//     "Municipios",
//     "Estratos",
//     "Modalidad",
//     "ValorMensual",
//     "CantidadMinutos"
//     ],
//     "id":"609dd416707d6457f0c11837"
//     },
//     {
//     "name":"TV por suscripción",
//     "code":5,
//     "filters":[
//     "TipoUsuario",
//     "Proveedores",
//     "Departamentos",
//     "Municipios",
//     "Estratos",
//     "Modalidad",
//     "ValorMensual",
//     "TecnologiaUsadaTV",
//     "CanalesPremium",
//     "CanalesHD",
//     "VideoDemanda"
//     ],
//     "id":"609dd547280d9930d0e31f9e"
//     }
// ]


const flowPrincipal = addKeyword(['hola', 'ole', 'alo'])
    .addAnswer([
        '🙌 Hola bienvenido a este *Chatbot*',
        'Soy un bot 🤖 de prueba que te  permite comparar planes de Internet, telefonía y TV por suscripción en Colombia',
    ])
    .addAnswer('Generando tipos de servicios...', null, async (ctx, { provider, fallBack, flowDynamic, gotoFlow }) => {
        const id = ctx.key.remoteJid

        let rows = []

        STATE_APP[ctx.from] = { ...STATE_APP[ctx.from] }

        const filterAPP = await FILTER_APP;

        STATE_APP[ctx.from].filterAPP = filterAPP

        filterAPP?.filtersData?.TipoServicios?.forEach((element, index) => {
            rows.push({ title: element.name, rowId: `options${index}`, id: element.name })
        })

        const sections = [{
            title: 'Lista de Servicios',
            rows: rows
        }]

        const listMessage = {
            text: 'Lista de Servicios',
            buttonText: 'Seleccionar',
            sections,
        }

        const abc = provider.getInstance()
        // console.log(abc)

        await abc.sendMessage(id, listMessage)

    })
    .addAnswer(['Selecione el servicio a comparar'], { capture: true }, async (ctx, { provider, fallBack, flowDynamic, gotoFlow }) => {
        const id = ctx.key.remoteJid
        const serviceName = ctx.body;

        const filterAPP = await FILTER_APP;
        const filters = filterAPP?.filtersData?.TipoServicios.find(s => s.name === serviceName)?.filters; // use Array.find() to get the element whose name matches, and then access the "filters" field using optional chaining (?.)

        STATE_APP[ctx.from].serviceName = serviceName


        let rows = []
        filters.forEach((element, index) => {
            if (element !== 'TipoUsuario') {
                name_filter = convertCamelCaseToSpaces(element)
                rows.push({
                    title: ` ▪️ ${name_filter}`,
                    rowId: `options${index}`,
                });
            }
        });

        const sections = [
            {
                title: 'Acciones',
                rows: [
                    { title: '➡️ Siguiente filtro', rowId: 'options1', id: 'Siguiente filtro' },
                    { title: '〽️ Volver al Menú', rowId: 'options2', id: 'Volver al Menú' },
                ]
            },
            {
                title: 'Filtros',
                rows: rows
            },
        ]

        const listMessage = {
            text: 'Lista de opciones',
            buttonText: 'Seleccionar Filtro',
            sections,
        }

        const abc = provider.getInstance()
        // console.log(abc)

        await flowDynamic(`Buscando los mejores productos para *${serviceName}*`)
        await abc.sendMessage(id, listMessage)

    })
    .addAnswer(['👣👣👣👣👣👣'], { capture: true }, async (ctx, { provider, fallBack, flowDynamic, gotoFlow }) => {
        const id = ctx.key.remoteJid
        const filterSelect = ctx.body.replace(' ▪️  ', '');

        let serviceName = STATE_APP[ctx.from].serviceName;
        STATE_APP[ctx.from].filterSelect = filterSelect;

        if (filterSelect === 'Volver al menú') return gotoFlow('flowPrincipal')
        if (filterSelect === 'siguiete filtro') return gotoFlow('flowPrincipal')


        const filterAPP = await FILTER_APP;
        const filters = filterAPP?.filtersData?.TipoServicios.find(s => s.name === serviceName)?.filters; // use Array.find() to get the element whose name matches, and then access the "filters" field using optional chaining (?.)

        if (!filters.includes(filterSelect)) fallBack(`Filtro ${filterSelect} no es valido vuelva a selecionar`)

        await flowDynamic(`Buscando los mejores productos para *${serviceName}* con el filtro *${filterSelect}*`)

    })
    .addAnswer(['👣👣👣👣👣👣'], { capture: true }, async (ctx, { provider, fallBack, flowDynamic, gotoFlow }) => {
        const id = ctx.key.remoteJid
        const body = ctx.body.replace(' ▪️  ', '');

        let serviceName = STATE_APP[ctx.from].serviceName;
        let filterSelect = STATE_APP[ctx.from].filterSelect;

        const sections = [
            {
                title: 'Buscar',
                rows: [
                    { title: '🔎 Buscar Productos', rowId: 'options1', description: 'Inice la busqueda de productos' },
                ]
            },
            {
                title: 'Acciones',
                rows: [
                    { title: '➡️ Siguiente filtro', rowId: 'options1', id: 'Siguiente filtro' },
                    { title: '〽️ Volver al Menú', rowId: 'options2', id: 'Volver al Menú' },
                ]
            },
            {
                title: 'Filtros',
                rows: []
            },
        ]

        const listMessage = {
            text: 'Lista de opciones',
            buttonText: 'Seleccionar Filtro',
            sections,
        }

        const abc = provider.getInstance()
        // console.log(abc)

        await flowDynamic(`Buscando los mejores productos para *${serviceName}*`)
        await abc.sendMessage(id, listMessage)

    })


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()

