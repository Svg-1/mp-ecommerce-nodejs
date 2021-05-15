var express = require('express');
var exphbs  = require('express-handlebars');
var mercadopago = require("mercadopago");
require("dotenv").config()
//una vez que instalamos e importamos la libreria, ahora es necesario definir las credenciales para que MP separa quienes somos, algo asi como cuando usamos firebase.
mercadopago.configure({ 
    //el access_token es la token que nos generará por cada integracion que realicemos, no se repite ya que la congifuracion será diferente. 
    access_token: process.env.ACCESS_TOKEN,
    //el integrator id es: la identificacion que nosotros tendremos una vez realizada la certificacion, esta nos ayudara para que MP sepa que desarrollador fue el responsable de dicha integracion.
    integrator_id: process.env.INTEGRATOR_ID,
});

var port = process.env.PORT || 3000
 
const cliente = {
    name: "Lalo",
    surname: "Landa",
    email: "test_user_46542185@testuser.com",
    phone: {
        number: 5549737300,
        area_code: "52"
    },
    address: {
        zip_code: "03940",
        street_name: "Insurgentes Sur",
        street_number: 1602
    },
    identification: {
        type: "DNI", //https://api.mercadopago.com/v1/identification_types
        number: "22334445",
    },
};

const metodos_pagos = {
    installments: 6, 
    exclude_payment_methods: [
        {
            id: "diners",
        },
    ],
    exclude_payment_types: [
        {
            id: "atm",
        },
    ],
};

const preferencia = {
    items: [],
    back_urls: {
        success: "",
        pending: "",
        failure: "",
    },
    payment_methods: metodos_pagos,
    payer: cliente,
    auto_return: "approved",
    notification_url: "", 
    external_reference: "valdivia.gomez.sandra@gmail.com",
}

var app = express();
 
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', async function (req, res) {
    console.log (req.query);
    const item = {
        id: "1234",
        title: req.query.title,
        description: "Dispositivo móvil de tienda e-commerce",
        picture_url: req.query.img,
        quantity: +req.query.unit,
        currency_id: "PEN",
        unit_price: +req.query.price,
    };
    preferencia.items.push(item);
    //ahora modificamos las back_url para indicar el dominio de nuestra aplicacion
    preferencia.back_urls.failure = `${req.get('host')}/failure`; //http:127.0.0.1:5000
    preferencia.back_urls.success = `${req.get('host')}/success`;
    preferencia.back_urls.pending = `${req.get('host')}/pending`;
    //el notificacion_url solo se puede utilizar en ambientes de producción (no localhost ni 127.0.0.1) porque es a ese endpoint en el cual mandará el estado de la pasarela de pago y por ende al identificar uno de los dominios anteriores lanzará un error y no se procederá con la pasarela.
    //preferencia.notificacion_url = `$req.get("host")}/notificaciones`

    const respuesta = await mercadopago.preferences.create(preferencia);
    console.log(respuesta);
    res.render('detail', req.query);    
});

app.listen(port);