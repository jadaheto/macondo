# -*- coding: utf-8 -*-
"""Guiones ORIGINALES de audioresúmenes (Macondo Digital, Comfasucre).
Resúmenes propios de obras en dominio público, redactados tras leer el texto (ver AUDIO-BIO-RESUMEN-FUENTES.md)."""

def q(prompt, options, answer, explanation):
    return {"prompt": prompt, "options": options, "answer": answer, "explanation": explanation}

RES = [
{
 "slug": "raton-perez", "work": "Ratón Pérez", "author": "Luis Coloma", "authorDeath": 1915,
 "catalogFile": "libros/gutenberg-36558.epub", "textSource": "https://www.gutenberg.org/ebooks/36558",
 "gradeMin": 1, "gradeMax": 4, "categories": ["Resúmenes", "Cuentos", "Literatura española", "Valores"],
 "description": "Resumen del cuento en que el pequeño rey Buby acompaña al Ratón Pérez a casa de Gilito, un niño pobre, y descubre que todos los niños son hermanos.",
 "body": [
  "Este cuento fue escrito hacia 1891 por el padre Luis Coloma para un niño de verdad: el pequeño rey Alfonso XIII de España. Según se cuenta, lo escribió cuando al niño rey se le cayó un diente.",
  "En el cuento, el protagonista es el rey Buby, un niño pequeño que reina con la ayuda de su madre. Un día se le mueve un diente y los médicos de la corte se lo sacan. Su mamá, la reina, le dice que escriba una carta al Ratón Pérez y que ponga el diente debajo de la almohada.",
  "Esa noche aparece un ratoncito muy elegante, con sombrero de paja, lentes de oro y una cartera roja. Es el Ratón Pérez. Buby y él se hacen amigos enseguida. El ratón le cuenta que debe ir a recoger el diente de otro niño, Gilito, que es muy pobre.",
  "Buby quiere acompañarlo. Con un cosquilleo en la nariz, el Ratón Pérez lo convierte en un ratoncito dorado. Juntos recorren túneles oscuros, visitan la casa de la familia Pérez, que vive en una caja de galletas, y pasan con mucho cuidado junto a un gato enorme llamado don Gaiferos.",
  "Por fin llegan a la buhardilla donde vive Gilito con su madre. Hace frío, no hay comida y el niño duerme sobre trapos. Buby nunca había visto tanta pobreza y se pone a llorar. Luego oye que Gilito reza el Padrenuestro, igual que él.",
  "Al día siguiente, Buby despierta en su cama con un regalo valioso, pero casi no lo mira. Le pregunta a su madre por qué los niños pobres rezan lo mismo que él. La reina le explica que todos son hermanos, y que un rey es como el hermano mayor que debe cuidar a los demás. Buby lo recuerda toda su vida."
 ],
 "ideas": ["Todos los niños y niñas, ricos o pobres, son iguales en dignidad.",
           "Conocer la realidad de otras personas despierta la compasión.",
           "Quien tiene más tiene también la responsabilidad de ayudar."],
 "questions": [
  q("¿Qué debía hacer Buby con su diente?", ["Tirarlo al río", "Ponerlo debajo de la almohada con una carta", "Guardarlo en una caja de oro"], 1, "La reina le pidió escribir al Ratón Pérez y poner el diente bajo la almohada."),
  q("¿En qué se convirtió Buby para acompañar al ratón?", ["En un pájaro", "En un ratoncito dorado", "En un gato"], 1, "Con un estornudo se convirtió en un ratoncito dorado."),
  q("¿Cómo vivía Gilito?", ["En un palacio", "En una buhardilla fría y pobre", "En una granja"], 1, "Vivía con su madre en una buhardilla muy pobre."),
  q("¿Qué aprendió Buby al final?", ["Que los niños pobres son sus hermanos", "Que los ratones son peligrosos", "Que los dientes valen mucho dinero"], 0, "Su madre le explicó que todos son hermanos.")]
},
{
 "slug": "la-tortuga-gigante", "work": "La tortuga gigante", "author": "Horacio Quiroga", "authorDeath": 1937,
 "catalogFile": None, "textSource": "https://es.wikisource.org/wiki/La_tortuga_gigante",
 "gradeMin": 1, "gradeMax": 4, "categories": ["Resúmenes", "Cuentos", "Naturaleza", "Literatura latinoamericana"],
 "description": "Resumen del cuento de Cuentos de la selva en que una tortuga salva al cazador que antes la había curado.",
 "body": [
  "La tortuga gigante es uno de los Cuentos de la selva, que el escritor uruguayo Horacio Quiroga publicó en 1918.",
  "Había una vez un hombre que vivía en Buenos Aires y trabajaba mucho para dar de comer a sus hermanitos. Un día se enfermó, y los médicos le dijeron que solo se curaría si se iba a vivir al campo. Un amigo suyo, director del zoológico, le propuso irse al monte, lejos, más allá de Misiones, a respirar aire puro.",
  "En el monte, el hombre se puso fuerte otra vez. Un día vio cómo un tigre atacaba a una tortuga enorme, tan alta como una silla. El cazador disparó contra el tigre y salvó a la tortuga, pero ella quedó muy herida. Aunque el hombre tenía hambre, sintió lástima por ella. La llevó a su refugio, le vendó la cabeza con tiras de su única camisa y la cuidó durante muchos días hasta que sanó.",
  "Después fue el hombre quien se enfermó de fiebre. Estaba solo y no podía levantarse. Entonces la tortuga, que lo había escuchado, decidió ayudarlo. Le dio agua en una cáscara de tortuga pequeña y le buscó raíces tiernas para comer. Y cuando comprendió que solo en Buenos Aires había remedios para él, lo amarró con enredaderas sobre su caparazón y emprendió un larguísimo viaje.",
  "Caminó de día y de noche, cruzó ríos y pantanos, y casi no comía para llegar más rápido. Cuando ya no tenía fuerzas, un ratoncito le contó que la luz que veía a lo lejos era la ciudad. La tortuga sacó fuerzas y llegó al zoológico. El director curó a su amigo, y la tortuga se quedó a vivir allí, querida por todos. El cazador la visita cada tarde."
 ],
 "ideas": ["La bondad se devuelve: quien ayuda puede ser ayudado.",
           "La gratitud y la perseverancia pueden lograr cosas muy difíciles.",
           "Los animales merecen respeto y cuidado."],
 "questions": [
  q("¿Por qué el hombre se fue a vivir al monte?", ["Para cazar tigres", "Porque estaba enfermo y necesitaba aire puro", "Porque se perdió"], 1, "Los médicos le dijeron que en el campo se curaría."),
  q("¿Qué hizo el hombre con la tortuga herida?", ["Se la comió", "La curó con tiras de su camisa", "La dejó sola"], 1, "Le vendó la cabeza y la cuidó hasta que sanó."),
  q("¿Cómo ayudó la tortuga al hombre?", ["Lo llevó sobre su caparazón hasta Buenos Aires", "Llamó a un médico por teléfono", "Le cantó una canción"], 0, "Lo cargó en un viaje larguísimo hasta la ciudad."),
  q("¿Qué valor muestra la tortuga en el cuento?", ["La gratitud", "La pereza", "El egoísmo"], 0, "Devolvió el bien que le habían hecho.")]
},
{
 "slug": "la-abeja-haragana", "work": "La abeja haragana", "author": "Horacio Quiroga", "authorDeath": 1937,
 "catalogFile": None, "textSource": "https://es.wikisource.org/wiki/La_abeja_haragana",
 "gradeMin": 2, "gradeMax": 5, "categories": ["Resúmenes", "Cuentos", "Naturaleza", "Valores"],
 "description": "Resumen del cuento de Quiroga sobre una abeja que no quería trabajar y aprende en una sola noche el valor del esfuerzo compartido.",
 "body": [
  "La abeja haragana también pertenece a los Cuentos de la selva, de Horacio Quiroga.",
  "En una colmena vivía una abeja que no quería trabajar. Volaba de flor en flor, pero en lugar de guardar el néctar para hacer miel, se lo tomaba todo. Mientras tanto, sus compañeras trabajaban sin descanso para alimentar a las abejas recién nacidas.",
  "Las abejas guardianas, que cuidan la puerta de la colmena, le advirtieron varias veces que debía trabajar. Ella siempre prometía hacerlo mañana. Hasta que un día, al caer una tarde fría y lluviosa, no la dejaron entrar. Le dijeron que no había lugar para las haraganas.",
  "Muerta de frío, la abejita cayó en el hueco de un árbol donde vivía una culebra. La culebra quiso comérsela, pero la abeja le propuso un desafío: ganaría quien hiciera la prueba más rara. La culebra hizo bailar un trompito hecho con una cápsula de eucalipto. La abeja, en cambio, dijo que podía desaparecer. Se acercó a una plantita llamada sensitiva, cuyas hojas se cierran al tocarlas, y quedó escondida dentro de una hoja. La culebra no la encontró y tuvo que darse por vencida.",
  "La abeja pasó una noche larguísima, con frío y miedo. Al amanecer volvió a la colmena, y esta vez las guardianas la dejaron entrar sin decir nada. Desde entonces fue la abeja más trabajadora de todas. Antes de morir, les explicó a las jóvenes que lo que hace fuertes a las abejas no es la inteligencia, sino el trabajo de todas por el bien común."
 ],
 "ideas": ["Cada miembro de una comunidad tiene responsabilidades con los demás.",
           "Dejar todo para mañana trae consecuencias.",
           "La observación de la naturaleza, como la de la sensitiva, puede salvarnos."],
 "questions": [
  q("¿Por qué la llamaban abeja haragana?", ["Porque no quería trabajar", "Porque volaba muy despacio", "Porque dormía en las flores"], 0, "Se tomaba el néctar en vez de llevarlo para hacer miel."),
  q("¿Qué pasó cuando la abeja no cumplió su promesa?", ["Le dieron un premio", "No la dejaron entrar a la colmena", "La nombraron reina"], 1, "Las guardianas le cerraron la entrada."),
  q("¿Cómo desapareció la abeja frente a la culebra?", ["Se escondió en una hoja de sensitiva que se cerró", "Voló muy alto", "Se enterró en la arena"], 0, "Las hojas de la sensitiva se cierran al menor contacto."),
  q("¿Qué enseñó la abeja a las jóvenes al final?", ["Que el trabajo de todas por el bien común las hace fuertes", "Que hay que ser más listas que las culebras", "Que no hay que salir de noche"], 0, "Esa fue su última lección.")]
},
{
 "slug": "bebe-y-el-senor-don-pomposo", "work": "Bebé y el señor don Pomposo", "author": "José Martí", "authorDeath": 1895,
 "catalogFile": "demo-content/files/marti-la-edad-de-oro.epub", "textSource": "https://www.gutenberg.org/ebooks/19898",
 "gradeMin": 2, "gradeMax": 5, "categories": ["Resúmenes", "Cuentos", "Literatura latinoamericana", "Valores"],
 "description": "Resumen del cuento de La Edad de Oro en que un niño rico decide regalar su sable dorado a su primo huérfano.",
 "body": [
  "Este cuento forma parte de La Edad de Oro, la revista para niños que José Martí escribió en 1889.",
  "Bebé es un niño de cinco años, de cabello rubio y rizado, que viste ropa muy elegante. No es perfecto: a veces hace travesuras. Pero tiene buen corazón. Quiere mucho a su mamá, le lleva azúcar a su caballo y, cuando ve a un niño descalzo, quiere darle todo lo que tiene.",
  "Bebé va a viajar a París con su mamá, que está enferma de tos, y esta vez lo acompaña su primo Raúl, un niño que no tiene mamá y que no viste ropas lujosas.",
  "Antes del viaje visitan al tío de la mamá, el señor don Pomposo, un hombre muy alto, muy estirado y muy interesado en el dinero. Don Pomposo trata a Bebé como a un pequeño rey, lo llena de besos y le regala un sable dorado muy caro. En cambio, a Raúl ni siquiera lo saluda. Raúl mira el sable con los ojos muy tristes.",
  "Esa noche, en la cama, Bebé no puede dormir. Piensa en el tío, en el sable y en la cara triste de su primo. Entonces se levanta en puntillas, toma el sable y, riéndose bajito, lo pone sobre la almohada de Raúl.",
  "Martí no nos dice qué pasó a la mañana siguiente. Deja que cada lector imagine la sorpresa de Raúl al despertar. Lo importante es lo que Bebé descubrió por sí mismo: que un regalo vale más cuando sirve para hacer feliz a otra persona."
 ],
 "ideas": ["La verdadera generosidad consiste en compartir lo que uno valora.",
           "Tratar mejor a unas personas que a otras por su dinero es injusto.",
           "Los niños pueden dar ejemplo de empatía a los adultos."],
 "questions": [
  q("¿Quién es Raúl?", ["El hermano mayor de Bebé", "El primo huérfano de Bebé", "El criado de don Pomposo"], 1, "Raúl es el primo de Bebé y no tiene mamá."),
  q("¿Qué le regaló don Pomposo a Bebé?", ["Un caballo", "Un sable dorado", "Un libro"], 1, "Le regaló un sable dorado muy caro."),
  q("¿Por qué Bebé se sintió mal con el regalo?", ["Porque el sable era feo", "Porque su tío no saludó a Raúl y Raúl estaba triste", "Porque quería otro juguete"], 1, "Le dolió la injusticia con su primo."),
  q("¿Qué hizo Bebé al final?", ["Escondió el sable", "Le regaló el sable a Raúl", "Devolvió el sable a su tío"], 1, "Puso el sable en la almohada de Raúl.")]
},
{
 "slug": "la-muneca-negra", "work": "La muñeca negra", "author": "José Martí", "authorDeath": 1895,
 "catalogFile": "demo-content/files/marti-la-edad-de-oro.epub", "textSource": "https://www.gutenberg.org/ebooks/19898",
 "gradeMin": 2, "gradeMax": 5, "categories": ["Resúmenes", "Cuentos", "Literatura latinoamericana", "Valores"],
 "description": "Resumen del cuento de La Edad de Oro en que Piedad prefiere su vieja muñeca negra, Leonor, a la muñeca lujosa que recibe en su cumpleaños.",
 "body": [
  "La muñeca negra es otro de los cuentos de La Edad de Oro, de José Martí.",
  "Piedad es una niña que está a punto de cumplir ocho años. Sus padres la quieren muchísimo. La noche antes de su cumpleaños entran de puntillas a su cuarto para verla dormir, rodeada de sus juguetes. En sus brazos duerme su muñeca preferida: Leonor, una muñeca negra, vieja, con poco pelo y la boca desteñida de tantos besos.",
  "El día del cumpleaños, toda la casa celebra. Hay chocolate, flores y una bandera que dice que Piedad cumple ocho años. Su papá le regala una muñeca nueva, muy lujosa, de seda y porcelana, con ojos azules y cabello rubio. Piedad le da las gracias y juega un rato con ella, pero siente que esa muñeca tiene unos ojos que no hablan.",
  "Durante el día, Piedad prepara en secreto un ramo de flores nomeolvides. Por la noche, cuando la criada apaga la luz y sale del cuarto, Piedad se levanta, busca a Leonor, que había quedado olvidada a los pies de la cama, y le da el ramo. La abraza, la besa y le dice que la quiere precisamente porque los demás no la quieren. Y se duermen juntas.",
  "El nombre de la flor que Piedad le regala a su muñeca es muy especial: nomeolvides quiere decir no me olvides. Con ese regalo, Piedad le promete a Leonor que nunca la dejará de lado, aunque llegue una muñeca más lujosa."
 ],
 "ideas": ["El cariño verdadero no depende de la apariencia ni del precio.",
           "Piedad defiende a quien es rechazado: su muñeca negra.",
           "El cuento invita a reflexionar sobre los prejuicios por el color de la piel."],
 "questions": [
  q("¿Cómo se llama la muñeca negra de Piedad?", ["Leonor", "Rosa", "Carmen"], 0, "Su muñeca preferida se llama Leonor."),
  q("¿Qué le regaló su papá en el cumpleaños?", ["Una muñeca de seda y porcelana", "Un vestido", "Un caballo"], 0, "Le regaló una muñeca lujosa de ojos azules."),
  q("¿Por qué Piedad prefiere a Leonor?", ["Porque es más nueva", "Porque la quiere y nadie más la quiere", "Porque es más grande"], 1, "Le dice: te quiero porque no te quieren."),
  q("¿Qué tema importante nos hace pensar este cuento?", ["El valor de no juzgar por la apariencia o el color", "La importancia de tener muchos juguetes", "Cómo hacer un pastel"], 0, "El cuento cuestiona los prejuicios.")]
},
{
 "slug": "el-camaron-encantado", "work": "El camarón encantado", "author": "José Martí (versión de un cuento de Laboulaye)", "authorDeath": 1895,
 "catalogFile": "demo-content/files/marti-la-edad-de-oro.epub", "textSource": "https://www.gutenberg.org/ebooks/19898",
 "gradeMin": 4, "gradeMax": 7, "categories": ["Resúmenes", "Cuentos", "Literatura latinoamericana", "Valores"],
 "description": "Resumen del cuento de magia de La Edad de Oro sobre Loppi, su ambiciosa esposa Masicas y un camarón que concede deseos.",
 "body": [
  "El camarón encantado es un cuento de magia que José Martí adaptó para La Edad de Oro a partir de un relato del escritor francés Édouard Laboulaye.",
  "En un pueblo cerca del mar Báltico vivía Loppi, un leñador muy pobre, con su esposa Masicas, una mujer de mal genio que lo regañaba todo el tiempo. Un día, Loppi encuentra en un charco un camarón enorme y lo mete en su saco para la cena. Pero el camarón le habla: es en realidad una maga poderosa, y le pide que lo deje libre. A cambio, le llena el morral de peces y le enseña un conjuro para llamarla cuando necesite algo.",
  "Masicas se alegra con los peces, pero pronto se cansa. Pide sopa y tocino; luego, comidas finas; después, vestidos de señora; más tarde, un castillo. Cada vez Loppi va al charco, temblando, y el camarón le concede el deseo, aunque le advierte que su mujer nunca dejará de pedir.",
  "Masicas llega a ser princesa y luego reina, con palacio, criados y corona. Pero tampoco está contenta. Finalmente exige reinar en el cielo y ser dueña del mundo. Loppi, por miedo a su mujer, lleva el pedido a la maga. Entonces el camarón se enfurece, le reprocha su cobardía y le quita todo lo que les había dado.",
  "Loppi vuelve a su choza con el morral vacío. Masicas, loca de rabia, se lanza contra él, y el cuento termina de manera trágica: ambos mueren. Es un final duro, como el de muchos cuentos tradicionales, que busca dejar una lección clara."
 ],
 "ideas": ["La ambición sin límites lleva a perderlo todo.",
           "Quien no sabe decir que no a una injusticia también es responsable.",
           "La gratitud y la moderación son valores para una vida feliz."],
 "questions": [
  q("¿Qué era en realidad el camarón?", ["Un pez común", "Una maga poderosa", "Un príncipe"], 1, "El camarón era una maga de mucho poder."),
  q("¿Cuál fue el último deseo de Masicas?", ["Un vestido nuevo", "Reinar en el cielo y ser dueña del mundo", "Una sopa"], 1, "Su ambición no tenía límites."),
  q("¿Qué le reprochó el camarón a Loppi?", ["Ser cobarde y no poner límites", "Ser mentiroso", "Ser perezoso"], 0, "La maga le dijo que los maridos cobardes hacen a las mujeres locas."),
  q("¿Qué enseñanza deja el cuento?", ["Que la ambición sin medida lo destruye todo", "Que hay que pedir siempre más", "Que los camarones son peligrosos"], 0, "Es una fábula sobre la codicia.")]
},
{
 "slug": "la-lechera", "work": "La lechera", "author": "Félix María Samaniego", "authorDeath": 1801,
 "catalogFile": "demo-content/files/samaniego-fabulas.epub", "textSource": "https://www.gutenberg.org/ebooks/55206",
 "gradeMin": 1, "gradeMax": 4, "categories": ["Resúmenes", "Fábulas", "Poesía", "Valores"],
 "description": "Resumen de la fábula de Samaniego sobre la lechera que soñaba con hacerse rica antes de vender su leche.",
 "body": [
  "La lechera es una de las fábulas más famosas de Félix María Samaniego, un escritor español del siglo dieciocho. Las fábulas son historias cortas, muchas veces en verso, que terminan con una enseñanza llamada moraleja.",
  "Una joven lechera camina sola hacia el mercado con un cántaro de leche sobre la cabeza. Va muy contenta y, mientras camina, empieza a imaginar todo lo que hará con el dinero.",
  "Piensa: con lo que me den por la leche compraré un canasto de huevos. De los huevos saldrán cien pollitos. Cuando crezcan, los venderé y compraré un cerdito. Lo engordaré con bellotas y castañas hasta que esté enorme. Luego lo venderé y compraré una vaca y un ternero que saltará por el campo.",
  "La lechera se emociona tanto con sus sueños que da un brinco de alegría. Y entonces... ¡el cántaro cae al suelo y se rompe! Adiós leche, adiós dinero, adiós huevos, pollos, cerdito, vaca y ternero.",
  "La fábula termina con un consejo: no hay que construir castillos en el aire ni ser demasiado ambiciosos, porque mientras soñamos con el futuro podemos descuidar lo que tenemos en el presente.",
  "Esta historia es muy antigua y se ha contado de muchas maneras en distintos países. Samaniego la escribió en verso, con rimas, para que fuera fácil de recordar. Puedes buscarla en el libro de Fábulas de la biblioteca y leerla en voz alta con tu familia."
 ],
 "ideas": ["Soñar está bien, pero hay que poner atención a lo que hacemos ahora.",
           "No conviene contar con algo antes de tenerlo.",
           "Las fábulas enseñan con historias breves y una moraleja."],
 "questions": [
  q("¿Qué llevaba la lechera en la cabeza?", ["Un cántaro de leche", "Una canasta de frutas", "Un sombrero"], 0, "Llevaba un cántaro de leche al mercado."),
  q("¿Qué pensaba comprar primero con el dinero?", ["Una vaca", "Un canasto de huevos", "Un vestido"], 1, "Primero quería comprar huevos para sacar pollitos."),
  q("¿Por qué se rompió el cántaro?", ["Porque la lechera dio un salto de alegría", "Porque la empujó un perro", "Porque llovió"], 0, "Se emocionó tanto que brincó y el cántaro cayó."),
  q("¿Cuál es la moraleja?", ["No hacer castillos en el aire y cuidar el presente", "Hay que correr al mercado", "La leche es mala"], 0, "No hay que contar con lo que aún no tenemos.")]
},
{
 "slug": "el-rayo-de-luna", "work": "El rayo de luna", "author": "Gustavo Adolfo Bécquer", "authorDeath": 1870,
 "catalogFile": "libros/gutenberg-53552.epub", "textSource": "https://www.gutenberg.org/ebooks/53552",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Leyendas", "Literatura española", "Romanticismo"],
 "description": "Resumen de la leyenda de Bécquer sobre Manrique, el joven soñador que persigue por Soria a una mujer misteriosa que resulta ser un rayo de luna.",
 "body": [
  "El rayo de luna es una de las Leyendas de Gustavo Adolfo Bécquer, el gran poeta del romanticismo español. Se publicó en 1862 y transcurre en la ciudad de Soria, junto al río Duero, en tiempos medievales.",
  "Manrique es un joven noble que no se interesa por las armas ni por las fiestas del castillo. Ama la soledad. Pasa horas mirando el fuego, el agua del río o las estrellas, y cree que en todas partes viven seres fantásticos. Es poeta, y sueña con un amor perfecto que no encuentra en el mundo real.",
  "Una noche de verano, mientras pasea por las ruinas del antiguo convento de los Templarios, ve algo blanco que se mueve entre los árboles: le parece el borde del vestido de una mujer. Convencido de que es la mujer de sus sueños, corre tras ella por los jardines, sube a las rocas de San Saturio y cree verla cruzar el río en una barca. La sigue hasta la ciudad y pasa la noche frente a una ventana iluminada. Pero al amanecer descubre que allí solo vive un caballero viejo y enfermo.",
  "Durante meses busca a la desconocida por toda Soria. Imagina cómo serán sus ojos, su voz, su cabello. Finalmente, otra noche de luna, vuelve a las ruinas y ve de nuevo la forma blanca. Se lanza hacia ella... y descubre que es solo un rayo de luna que se cuela entre las ramas cuando el viento las mueve.",
  "Años después, Manrique vive encerrado en su castillo, triste y ausente. Cuando su madre le habla de amor, o un escudero de gloria, él responde que todo es un rayo de luna. La gente cree que se ha vuelto loco. El narrador, en cambio, sugiere que quizá ha recuperado el juicio."
 ],
 "ideas": ["Bécquer contrapone la imaginación idealista con la realidad.",
           "El texto reflexiona sobre la desilusión: los ideales absolutos pueden ser inalcanzables.",
           "Es un ejemplo de los rasgos románticos: soledad, ambiente nocturno, ruinas, misterio y amor ideal."],
 "questions": [
  q("¿En qué ciudad transcurre la leyenda?", ["Toledo", "Soria", "Sevilla"], 1, "Transcurre en Soria, junto al río Duero."),
  q("¿Qué persigue Manrique?", ["A un ladrón", "A una mujer misteriosa vestida de blanco", "A un caballo"], 1, "Cree ver el vestido blanco de una mujer."),
  q("¿Qué era realmente la forma blanca?", ["Un fantasma", "Un rayo de luna entre las ramas", "Una monja"], 1, "Era un rayo de luna que se filtraba entre los árboles."),
  q("¿Qué rasgos del romanticismo aparecen en la leyenda?", ["Soledad, noche, ruinas y amor ideal", "Humor y ciudades modernas", "Ciencia y tecnología"], 0, "Son rasgos típicos del romanticismo."),
  q("¿Por qué crees que el narrador dice que Manrique quizá recuperó el juicio?", ["Porque entendió que perseguía ilusiones", "Porque se casó", "Porque se hizo rico"], 0, "Manrique comprende que sus ideales eran fantasías.")]
},
{
 "slug": "mi-ultimo-adios", "work": "Mi último adiós", "author": "José Rizal", "authorDeath": 1896,
 "catalogFile": "libros/gutenberg-18600.epub", "textSource": "https://www.gutenberg.org/ebooks/18600",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Poesía", "Literatura en español", "Historia"],
 "description": "Resumen y contexto del poema que el filipino José Rizal escribió en español antes de ser fusilado en Manila en 1896.",
 "body": [
  "José Rizal fue un médico, escritor y patriota filipino. En el siglo diecinueve, Filipinas era una colonia de España, y Rizal escribió en español novelas como Noli me tángere y El filibusterismo, en las que denunciaba los abusos del gobierno colonial. Por sus ideas fue acusado de rebelión y condenado a muerte. Fue fusilado en Manila el 30 de diciembre de 1896.",
  "La noche antes de su ejecución escribió un poema de catorce estrofas, sin título, que hoy se conoce como Mi último adiós. Según la tradición, lo escondió dentro de una pequeña lámpara que entregó a su familia.",
  "El poema comienza con una despedida a su patria, a la que llama perla del mar de Oriente y edén perdido. Rizal dice que entrega su vida con alegría, porque morir por su tierra le parece hermoso, sea en el campo de batalla o en el cadalso.",
  "Luego recuerda que, desde niño y joven, soñó con ver a Filipinas libre y digna. Pide a su patria que, si alguna vez ve brotar una flor humilde sobre su tumba, la bese en su nombre. Imagina su sepulcro olvidado, sin cruz ni piedra, y dice que no importa: sus cenizas se convertirán en polvo de la tierra amada, y él seguirá presente en el aire, en la luz, en los colores y en los cantos.",
  "Al final se despide de sus padres, hermanos, amigos de la infancia y de una dulce extranjera, su compañera. Afirma que va a un lugar donde no hay esclavos, verdugos ni opresores, y termina con la idea de que morir es descansar.",
  "El poema se convirtió en un símbolo de la lucha por la independencia de Filipinas, que llegó en el siglo veinte. Hoy Rizal es el héroe nacional de ese país, y su poema se ha traducido a muchísimas lenguas."
 ],
 "ideas": ["El poema expresa un amor profundo por la patria y la disposición al sacrificio.",
           "Rizal transforma la muerte en una forma de seguir presente en su tierra.",
           "Es un testimonio de la literatura en español fuera de España y América."],
 "questions": [
  q("¿De qué país era José Rizal?", ["Cuba", "Filipinas", "México"], 1, "Rizal es el héroe nacional de Filipinas."),
  q("¿Cuándo escribió el poema?", ["Poco antes de ser fusilado", "Cuando era niño", "Después de la independencia"], 0, "Lo escribió antes de su ejecución en 1896."),
  q("¿Cómo llama Rizal a su patria en el poema?", ["Perla del mar de Oriente", "Tierra del fuego", "Isla del tesoro"], 0, "La llama perla del mar de Oriente."),
  q("¿Por qué crees que este poema se volvió un símbolo nacional?", ["Porque expresa el sacrificio por la libertad de su pueblo", "Porque es muy corto", "Porque habla de animales"], 0, "Representa el anhelo de libertad de Filipinas.")]
},
{
 "slug": "coplas-por-la-muerte-de-su-padre", "work": "Coplas por la muerte de su padre", "author": "Jorge Manrique", "authorDeath": 1479,
 "catalogFile": "libros/gutenberg-49333.epub", "textSource": "https://www.gutenberg.org/ebooks/49333",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Poesía", "Literatura española", "Edad Media"],
 "description": "Resumen de las Coplas de Jorge Manrique: la brevedad de la vida, la fama y la muerte, en homenaje a su padre don Rodrigo.",
 "body": [
  "Las Coplas por la muerte de su padre son uno de los poemas más importantes de la literatura española. Las escribió Jorge Manrique, poeta y soldado del siglo quince, tras la muerte de su padre, don Rodrigo Manrique, maestre de la Orden de Santiago, en 1476.",
  "El poema tiene cuarenta coplas, o estrofas, escritas con un ritmo muy musical. Se puede dividir en tres partes.",
  "En la primera parte, el poeta reflexiona de forma general sobre la vida y la muerte. Invita al lector a despertar y a pensar en lo rápido que pasa la vida. Aquí están sus versos más famosos, que comparan nuestras vidas con los ríos que van a dar en el mar, que es el morir. Grandes, medianos y pequeños ríos llegan al mismo mar: ricos y pobres son iguales ante la muerte. También advierte que los bienes de este mundo, como la belleza, la riqueza o el poder, son pasajeros.",
  "En la segunda parte, Manrique da ejemplos de su propia época. Pregunta qué se hizo de reyes, príncipes, damas, fiestas y vestidos lujosos que brillaron poco antes y ya desaparecieron. Esta pregunta repetida, ¿qué se hizo?, expresa la idea de que todo lo terrenal se acaba.",
  "En la tercera parte, el poema se centra en don Rodrigo. Lo presenta como un caballero valiente, justo y leal, amigo de sus amigos. Entonces aparece la Muerte personificada, que llama a su puerta y le habla con respeto. Le explica que existen tres vidas: la vida terrenal, que se acaba; la vida de la fama, que permanece en la memoria de los demás gracias a las buenas obras; y la vida eterna. Don Rodrigo acepta morir con serenidad, rodeado de su familia, y el poema termina diciendo que, aunque perdió la vida, dejó un gran consuelo con su memoria."
 ],
 "ideas": ["La vida es breve y la muerte iguala a todas las personas.",
           "Los bienes materiales son pasajeros; las buenas acciones dejan memoria.",
           "El poema distingue tres vidas: la terrenal, la de la fama y la eterna."],
 "questions": [
  q("¿A quién está dedicado el poema?", ["Al rey de Castilla", "A don Rodrigo Manrique, padre del poeta", "A una dama"], 1, "Es un homenaje a su padre."),
  q("¿Con qué compara Manrique nuestras vidas?", ["Con los ríos que van a dar en el mar", "Con las montañas", "Con las estrellas"], 0, "El mar representa la muerte."),
  q("¿Qué significa la pregunta repetida ¿qué se hizo?", ["Que todo lo terrenal desaparece", "Que hay que trabajar más", "Que el poeta olvidó algo"], 0, "Expresa la fugacidad de lo mundano."),
  q("¿Cuáles son las tres vidas de las que habla la Muerte?", ["Terrenal, de la fama y eterna", "Infancia, juventud y vejez", "Mañana, tarde y noche"], 0, "La fama permanece gracias a las buenas obras.")]
},
{
 "slug": "lazarillo-de-tormes", "work": "Lazarillo de Tormes", "author": "Anónimo", "authorDeath": None,
 "catalogFile": "libros/gutenberg-320.epub", "textSource": "https://www.gutenberg.org/ebooks/320",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Novela", "Literatura española", "Novela picaresca"],
 "description": "Resumen de la novela anónima de 1554 que inaugura la picaresca: la vida de Lázaro y sus amos, contada por él mismo.",
 "body": [
  "La vida de Lazarillo de Tormes y de sus fortunas y adversidades es una novela breve publicada en 1554, de autor desconocido. Está escrita como una carta en la que Lázaro, ya adulto, cuenta su vida a un señor importante. Es la primera novela picaresca: la historia de un pícaro, un muchacho pobre que sobrevive gracias a su astucia.",
  "Lázaro nace junto al río Tormes, cerca de Salamanca, en una familia muy pobre. Su padre muere, y su madre lo entrega a un ciego para que le sirva de guía. El ciego es astuto y cruel. Su primera lección es golpearle la cabeza contra un toro de piedra para que aprenda a estar alerta. Lázaro pasa hambre y aprende a engañar a su amo: por ejemplo, le bebe el vino a escondidas con una pajita, aunque el ciego casi siempre descubre sus trampas. Al final se venga de él y lo abandona.",
  "Su segundo amo es un clérigo de Maqueda, aún más tacaño que el ciego. Guarda el pan en un arca bajo llave, y Lázaro se las ingenia para sacar migas haciendo creer que son ratones o una culebra, hasta que el clérigo lo descubre y lo despide.",
  "En Toledo encuentra a un escudero, un hidalgo muy elegante que presume de honra, pero que en realidad no tiene nada que comer. Lázaro, conmovido, termina compartiendo con él el pan que consigue mendigando. Este capítulo critica la apariencia vacía de la nobleza pobre.",
  "Después sirve brevemente a un fraile de la Merced, a un buldero que vende bulas con trucos y engaños, a un pintor de panderos y a un capellán, para quien trabaja como aguador y logra ahorrar algo de dinero. Finalmente obtiene un oficio real: pregonero en Toledo. Se casa con la criada de un arcipreste y, aunque la gente murmura, él decide no hacer caso. Dice que está en la cumbre de toda buena fortuna.",
  "La novela, con humor e ironía, critica la hipocresía de la sociedad de su tiempo, incluida la de algunos religiosos. Por eso fue prohibida durante un tiempo."
 ],
 "ideas": ["El Lazarillo inaugura la novela picaresca, contada en primera persona.",
           "A través de los amos se critica la avaricia, la hipocresía y la obsesión por la honra.",
           "El hambre y la necesidad empujan a Lázaro a aprender a sobrevivir."],
 "questions": [
  q("¿Quién fue el primer amo de Lázaro?", ["Un clérigo", "Un ciego", "Un escudero"], 1, "Su madre lo entregó a un ciego."),
  q("¿Qué critica el episodio del escudero?", ["La apariencia de honra sin recursos reales", "La vida en el campo", "La guerra"], 0, "El escudero aparenta riqueza pero pasa hambre."),
  q("¿Qué oficio tiene Lázaro al final?", ["Pregonero en Toledo", "Soldado", "Médico"], 0, "Consigue el oficio de pregonero."),
  q("¿Por qué se considera la primera novela picaresca?", ["Porque narra en primera persona la vida de un pícaro que sobrevive con astucia", "Porque tiene caballeros y dragones", "Porque es una obra de teatro"], 0, "Cuenta la vida de un joven pobre y astuto."),
  q("¿Por qué crees que la obra se publicó sin nombre de autor?", ["Porque criticaba a personas poderosas e instituciones", "Porque el autor era un niño", "Porque se perdió la portada"], 0, "Sus críticas podían traerle problemas al autor.")]
},
{
 "slug": "don-quijote", "work": "Don Quijote de la Mancha", "author": "Miguel de Cervantes Saavedra", "authorDeath": 1616,
 "catalogFile": "libros/gutenberg-2000.epub", "textSource": "https://www.gutenberg.org/ebooks/2000",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Novela", "Literatura española", "Clásicos"],
 "description": "Resumen de las dos partes del Quijote (1605 y 1615): las aventuras del hidalgo que quiso ser caballero andante y de su escudero Sancho Panza.",
 "body": [
  "El ingenioso hidalgo don Quijote de la Mancha, de Miguel de Cervantes, es considerado la primera novela moderna y la obra más importante de la lengua española. La primera parte se publicó en 1605 y la segunda en 1615.",
  "En un lugar de la Mancha vive un hidalgo de unos cincuenta años, Alonso Quijano. Lee tantos libros de caballerías que pierde el juicio y decide hacerse caballero andante para deshacer injusticias. Limpia unas armas viejas, llama a su flaco caballo Rocinante, se hace llamar don Quijote y escoge como dama de sus pensamientos a una labradora del Toboso, a quien llama Dulcinea.",
  "En su primera salida, un ventero lo arma caballero en una ceremonia burlesca. De regreso a casa, el cura y el barbero de su pueblo queman muchos de sus libros, creyendo que así se curará. Pero don Quijote sale de nuevo, esta vez acompañado por un vecino, Sancho Panza, un labrador sencillo a quien promete el gobierno de una ínsula.",
  "Así comienzan sus famosas aventuras. Don Quijote ataca unos molinos de viento creyendo que son gigantes; confunde rebaños de ovejas con ejércitos; toma una bacía de barbero por el yelmo de Mambrino; libera a unos presos condenados a galeras, que terminan apedreándolo. Sancho, práctico y realista, le advierte una y otra vez, pero lo sigue con lealtad. Al final de la primera parte, el cura y el barbero logran llevarlo de vuelta a casa en una jaula.",
  "En la segunda parte, don Quijote y Sancho ya son famosos, porque la gente ha leído la primera parte. Unos duques los reciben en su palacio para divertirse a su costa con bromas; incluso hacen a Sancho gobernador de una supuesta ínsula, donde sorprende a todos con su sentido común y sus sentencias justas. Finalmente, el bachiller Sansón Carrasco, disfrazado de Caballero de la Blanca Luna, vence a don Quijote en Barcelona y le obliga a volver a casa.",
  "Ya en su aldea, don Quijote enferma. Antes de morir recupera la razón, vuelve a llamarse Alonso Quijano el Bueno y reniega de los libros de caballerías. Sancho, llorando, le propone salir otra vez de aventuras."
 ],
 "ideas": ["La novela contrapone el idealismo de don Quijote y el realismo de Sancho, que se influyen mutuamente.",
           "Cervantes parodia los libros de caballerías y reflexiona sobre la ficción y la realidad.",
           "Don Quijote, aunque loco, defiende valores como la justicia, la libertad y la generosidad."],
 "questions": [
  q("¿Por qué Alonso Quijano decide hacerse caballero andante?", ["Porque leyó demasiados libros de caballerías", "Porque se lo ordenó el rey", "Porque quería ser rico"], 0, "Las lecturas le hicieron perder el juicio."),
  q("¿Qué creía don Quijote que eran los molinos de viento?", ["Castillos", "Gigantes", "Dragones"], 1, "Es su aventura más famosa."),
  q("¿Qué le promete don Quijote a Sancho?", ["El gobierno de una ínsula", "Un caballo nuevo", "Un libro"], 0, "Le promete una ínsula para gobernar."),
  q("¿Quién vence a don Quijote al final?", ["El Caballero de la Blanca Luna", "Un gigante", "El ventero"], 0, "Es Sansón Carrasco disfrazado."),
  q("¿En qué se diferencian don Quijote y Sancho?", ["Uno es idealista y el otro práctico y realista", "Los dos son iguales", "Sancho es el caballero y don Quijote el escudero"], 0, "Su contraste es el centro de la novela.")]
},
{
 "slug": "marianela", "work": "Marianela", "author": "Benito Pérez Galdós", "authorDeath": 1920,
 "catalogFile": "libros/gutenberg-17340.epub", "textSource": "https://www.gutenberg.org/ebooks/17340",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Novela", "Literatura española", "Realismo"],
 "description": "Resumen de la novela de Galdós (1878) sobre Nela, la muchacha pobre que guía a Pablo, un joven ciego que recupera la vista.",
 "body": [
  "Marianela es una novela de Benito Pérez Galdós publicada en 1878. Transcurre en Socartes, una zona de minas en el norte de España.",
  "Marianela, a quien todos llaman Nela, es una muchacha huérfana, pequeña y delgada, que vive casi de caridad en casa de una familia de mineros que no le da cariño. Ella misma se siente fea e inútil. Sin embargo, tiene un corazón enorme y una gran sensibilidad.",
  "Nela sirve de lazarillo a Pablo, el hijo de un hombre rico de Aldeacorba, que es ciego de nacimiento. Pablo es inteligente y culto, y Nela lo guía por los campos y le describe el mundo con su imaginación. Entre los dos nace una amistad muy profunda. Pablo, que no puede verla, imagina que Nela es hermosa, porque su bondad le parece belleza. Ella, en cambio, teme el día en que él pueda verla.",
  "Un día llega a la región el médico Teodoro Golfín, un oculista famoso, que decide operar a Pablo. Al mismo tiempo llega Florentina, prima de Pablo, una joven bella y generosa con quien el padre de Pablo desea casarlo. Florentina quiere ayudar a Nela, vestirla y educarla.",
  "La operación tiene éxito y Pablo recupera la vista. Nela, convencida de que él la rechazará al verla, huye y piensa en desaparecer. Golfín la encuentra y la lleva a la casa, pero ella está muy débil y enferma de tristeza. Cuando Pablo la ve por fin, no la reconoce de inmediato, y queda impresionado por la belleza de Florentina. Al comprender quién es Nela, le toma la mano con cariño, pero ella muere poco después.",
  "La novela critica una sociedad que ignora a los pobres y valora a las personas por su apariencia. Galdós también reflexiona sobre la diferencia entre la imaginación y la realidad, y sobre la caridad que llega demasiado tarde."
 ],
 "ideas": ["La belleza interior frente a la apariencia física.",
           "La crítica a la indiferencia social hacia los pobres y los huérfanos.",
           "El contraste entre lo que imaginamos y la realidad que vemos."],
 "questions": [
  q("¿Qué hacía Nela por Pablo?", ["Era su lazarillo y le describía el mundo", "Le cocinaba", "Le enseñaba matemáticas"], 0, "Nela guiaba a Pablo, que era ciego."),
  q("¿Quién opera a Pablo?", ["El médico Teodoro Golfín", "Florentina", "El padre de Pablo"], 0, "Golfín era un oculista famoso."),
  q("¿Qué temía Nela?", ["Que Pablo la rechazara al verla", "Que Pablo se fuera de viaje", "Perder su trabajo"], 0, "Se creía fea y temía el día en que Pablo viera."),
  q("¿Qué critica la novela?", ["Que la sociedad juzgue por la apariencia e ignore a los pobres", "La vida en la ciudad", "Las minas modernas"], 0, "Es una crítica social del realismo.")]
},
{
 "slug": "el-si-de-las-ninas", "work": "El sí de las niñas", "author": "Leandro Fernández de Moratín", "authorDeath": 1828,
 "catalogFile": "libros/gutenberg-50027.epub", "textSource": "https://www.gutenberg.org/ebooks/50027",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Teatro", "Literatura española", "Ilustración"],
 "description": "Resumen de la comedia de Moratín (1806) sobre un matrimonio concertado entre una joven de dieciséis años y un hombre de cincuenta y nueve.",
 "body": [
  "El sí de las niñas es una comedia en tres actos de Leandro Fernández de Moratín, estrenada en Madrid en 1806. Toda la acción ocurre en una sola noche, en una posada de Alcalá de Henares.",
  "Doña Irene, una viuda que necesita dinero, ha sacado a su hija, doña Francisca, a quien llaman Paquita, del convento de Guadalajara donde se educaba. Quiere casarla con don Diego, un señor rico, sensato y bondadoso, que tiene cincuenta y nueve años. Paquita tiene apenas dieciséis. Nadie le ha preguntado lo que ella quiere, y su madre da por hecho que dirá que sí.",
  "Pero Paquita está enamorada de un joven militar al que conoce como don Félix. Con la ayuda de su criada Rita, le ha escrito pidiéndole ayuda. El joven llega a la posada esa misma noche, acompañado de su criado Calamocha.",
  "La sorpresa es que don Félix es en realidad don Carlos, el sobrino de don Diego, a quien su tío quiere como a un hijo. Cuando don Diego descubre la verdad, ordena a su sobrino que se vaya, y don Carlos obedece por respeto, aunque está desesperado. Durante la noche, don Carlos intenta comunicarse con Paquita, y una carta suya cae en manos de don Diego.",
  "Don Diego comprende que Paquita nunca lo amará y que su sí habría sido fruto de la obediencia y del miedo. Generosamente, renuncia al matrimonio, hace volver a su sobrino y bendice la unión de los jóvenes. Además, critica la educación que enseña a las muchachas a ocultar sus sentimientos y a decir que sí sin libertad.",
  "La obra, típica de la Ilustración, busca entretener y a la vez enseñar: defiende el derecho de las jóvenes a elegir con quién casarse y critica los matrimonios por interés."
 ],
 "ideas": ["La comedia defiende la libertad para elegir pareja.",
           "Critica la educación autoritaria que obliga a fingir y obedecer.",
           "Don Diego representa la razón y la generosidad, ideales de la Ilustración."],
 "questions": [
  q("¿Dónde transcurre la obra?", ["En un palacio de Madrid", "En una posada de Alcalá de Henares", "En un barco"], 1, "Toda la acción ocurre en una posada."),
  q("¿Quién es en realidad don Félix?", ["Don Carlos, sobrino de don Diego", "El hermano de Paquita", "Un criado"], 0, "Es el sobrino de don Diego."),
  q("¿Qué decide don Diego al final?", ["Casarse de todos modos", "Renunciar y permitir la boda de los jóvenes", "Volver al convento"], 1, "Renuncia con generosidad."),
  q("¿Qué critica la obra?", ["Los matrimonios concertados sin libertad", "Los viajes en diligencia", "La vida militar"], 0, "Defiende el derecho a elegir.")]
},
{
 "slug": "fuente-ovejuna", "work": "Fuente Ovejuna", "author": "Lope de Vega", "authorDeath": 1635,
 "catalogFile": "libros/gutenberg-60198.epub", "textSource": "https://www.gutenberg.org/ebooks/60198",
 "gradeMin": 9, "gradeMax": 11, "categories": ["Resúmenes", "Teatro", "Literatura española", "Siglo de Oro"],
 "description": "Resumen del drama de Lope de Vega sobre un pueblo que se levanta unido contra los abusos de su comendador.",
 "body": [
  "Fuente Ovejuna es un drama de Lope de Vega, publicado en 1619, basado en un hecho histórico ocurrido en 1476 en el pueblo de Fuente Obejuna, en Córdoba, España.",
  "El Comendador Fernán Gómez de Guzmán es el señor de la villa. Es un hombre arrogante que abusa de su poder: trata con desprecio a los campesinos y acosa a las mujeres del pueblo. Al mismo tiempo, participa en una rebelión contra los Reyes Católicos, Isabel y Fernando, y ataca la ciudad de Ciudad Real.",
  "En el pueblo viven Laurencia, una joven valiente e hija del alcalde Esteban, y Frondoso, un campesino que la ama. Un día el Comendador intenta forzar a Laurencia, y Frondoso la defiende amenazándolo con su propia ballesta. Desde entonces, el Comendador busca vengarse.",
  "Laurencia y Frondoso se casan, pero en plena boda el Comendador irrumpe, arresta a Frondoso, golpea al alcalde Esteban y se lleva a Laurencia. Más tarde ella escapa y llega a la reunión de los hombres del pueblo. Con un discurso apasionado los acusa de cobardía por no defender su dignidad. Sus palabras despiertan a todos.",
  "El pueblo entero, hombres y mujeres, se levanta, entra en la casa del Comendador, libera a Frondoso y da muerte al tirano. Luego los vecinos acuerdan una respuesta común.",
  "Cuando llega un juez enviado por los reyes para averiguar quién mató al Comendador, interroga a muchos vecinos, incluso con tortura. Todos, hasta un niño y un anciano, responden lo mismo: Fuente Ovejuna lo hizo. Como no puede culpar a nadie en particular, el juez informa a los reyes. Los Reyes Católicos, conociendo los abusos del Comendador, perdonan al pueblo y lo ponen bajo su protección."
 ],
 "ideas": ["La unidad y la solidaridad de un pueblo frente a la injusticia.",
           "La defensa de la dignidad y del honor de las personas humildes.",
           "Lope presenta a los reyes como garantes de la justicia frente a los nobles abusivos."],
 "questions": [
  q("¿Quién es el Comendador en la obra?", ["Un campesino", "El señor de la villa que abusa de su poder", "El rey"], 1, "Fernán Gómez abusa de los habitantes."),
  q("¿Qué responden los vecinos al juez?", ["Que no saben nada", "Fuente Ovejuna lo hizo", "Que fue Frondoso"], 1, "Todos responden lo mismo, como un solo pueblo."),
  q("¿Qué papel tiene Laurencia en la rebelión?", ["Con su discurso despierta al pueblo", "Se esconde", "Avisa al Comendador"], 0, "Su valentía impulsa la reacción colectiva."),
  q("¿Qué deciden los Reyes Católicos al final?", ["Castigar al pueblo", "Perdonar al pueblo", "Nombrar un nuevo comendador cruel"], 1, "Perdonan a los vecinos."),
  q("¿Qué valor central defiende la obra?", ["La solidaridad frente a la injusticia", "La obediencia ciega", "La venganza individual"], 0, "El pueblo actúa unido.")]
},
{
 "slug": "el-capitan-veneno", "work": "El Capitán Veneno", "author": "Pedro Antonio de Alarcón", "authorDeath": 1891,
 "catalogFile": "libros/gutenberg-29731.epub", "textSource": "https://www.gutenberg.org/ebooks/29731",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Novela", "Literatura española", "Humor"],
 "description": "Resumen de la novela corta de Alarcón (1881) sobre un capitán gruñón que, herido, es cuidado por una viuda y su hija Angustias.",
 "body": [
  "El Capitán Veneno es una novela corta de Pedro Antonio de Alarcón, publicada en 1881. Es una historia de humor y ternura que transcurre en Madrid a mediados del siglo diecinueve.",
  "En marzo de 1848, durante unos disturbios en las calles de Madrid, un capitán del ejército cae herido frente a la casa de una viuda, la generala Barbastro, que vive con su hija Angustias, una joven bella e inteligente. Las dos mujeres lo recogen y lo cuidan en su casa.",
  "El herido es don Jorge de Córdoba, a quien todos conocen como el Capitán Veneno por su mal carácter. Es gruñón, malhablado y presume de odiar a las mujeres, a los niños y al matrimonio. Durante su convalecencia protesta por todo y trata de manera brusca a quienes lo atienden. Pero Angustias no se deja intimidar: le responde con ingenio y firmeza, y poco a poco el capitán empieza a cambiar.",
  "Mientras tanto, la madre de Angustias enferma y muere. La joven queda sola y casi sin recursos. El capitán, que ya se ha enamorado de ella aunque no quiera admitirlo, intenta ayudarla de mil maneras torpes, y al final, a su manera brusca, le propone matrimonio. Angustias, orgullosa, no acepta hasta estar segura de que él la ama de verdad.",
  "La escena final ocurre cuatro años después. Un amigo visita al capitán, que ahora es marqués, y lo encuentra a cuatro patas sobre la alfombra, haciendo de caballito para sus dos hijos pequeños, que le gritan: ¡Arre, mula! El terrible Capitán Veneno se ha convertido en un padre cariñoso."
 ],
 "ideas": ["El amor y la paciencia pueden transformar a las personas.",
           "Detrás de una apariencia ruda puede haber un buen corazón.",
           "Angustias representa la inteligencia y la dignidad frente al orgullo."],
 "questions": [
  q("¿Por qué llamaban a don Jorge el Capitán Veneno?", ["Por su mal carácter", "Porque era químico", "Porque lo mordió una serpiente"], 0, "Era gruñón y malhumorado."),
  q("¿Quiénes cuidaron al capitán herido?", ["Unos soldados", "Una viuda y su hija Angustias", "Un médico del ejército"], 1, "La generala Barbastro y Angustias lo atendieron."),
  q("¿Cómo termina la historia?", ["El capitán se va a la guerra", "El capitán aparece jugando con sus hijos", "Angustias se casa con otro"], 1, "Hace de caballito para sus dos hijos."),
  q("¿Qué mensaje deja la novela?", ["El amor puede transformar a las personas", "No hay que ayudar a los desconocidos", "La guerra es divertida"], 0, "El capitán cambia gracias al amor.")]
},
{
 "slug": "trafalgar", "work": "Trafalgar", "author": "Benito Pérez Galdós", "authorDeath": 1920,
 "catalogFile": "libros/gutenberg-16961.epub", "textSource": "https://www.gutenberg.org/ebooks/16961",
 "gradeMin": 8, "gradeMax": 11, "categories": ["Resúmenes", "Novela", "Literatura española", "Historia"],
 "description": "Resumen del primer Episodio Nacional de Galdós: la batalla de Trafalgar (1805) vista por Gabriel Araceli, un muchacho de catorce años.",
 "body": [
  "Trafalgar, publicada en 1873, es la primera de las novelas que Benito Pérez Galdós llamó Episodios Nacionales, en las que mezcló personajes inventados con hechos reales de la historia de España.",
  "El narrador es Gabriel Araceli, que, ya anciano, recuerda su juventud. Gabriel es un huérfano de Cádiz que creció en la pobreza. A los catorce años entra a servir en la casa de don Alonso Gutiérrez de Cisniega, un viejo marino retirado, y de su esposa, doña Francisca, que detesta la guerra. En esa casa conoce a Rosita, la hija de los señores, de quien se enamora en silencio, y a Marcial, un viejo marinero al que llaman Medio-hombre porque ha perdido en combate un brazo, una pierna y un ojo.",
  "En 1805, España es aliada de Francia, gobernada por Napoleón, en guerra contra Inglaterra. Una gran flota hispano francesa se reúne en Cádiz. Don Alonso y Marcial, contra la voluntad de doña Francisca, se escapan para unirse a la escuadra, y llevan con ellos a Gabriel. Embarcan en el Santísima Trinidad, el barco más grande de su tiempo.",
  "El 21 de octubre se libra la batalla de Trafalgar contra la flota inglesa del almirante Nelson. Gabriel vive el combate con horror y admiración: el estruendo de los cañones, los mástiles derribados, los heridos y los muertos. Ve el valor de marinos como Churruca y Gravina, pero también los errores del mando. La flota hispano francesa es derrotada, y el Santísima Trinidad, destrozado, termina hundiéndose.",
  "Tras la batalla, una tormenta terrible empeora el desastre. Marcial muere. Gabriel sobrevive y regresa a Cádiz con don Alonso. Ya no es el mismo niño: ha conocido el dolor de la guerra y ha descubierto un sentimiento nuevo, el amor por la patria entendida como la comunidad de personas a la que pertenece.",
  "La novela combina la emoción de la aventura con una mirada crítica sobre la guerra y sus consecuencias."
 ],
 "ideas": ["Galdós mezcla historia real y ficción para acercar el pasado a los lectores.",
           "La batalla se ve desde los ojos de un muchacho, lo que la hace más humana.",
           "La obra muestra el heroísmo y, a la vez, el horror y el sinsentido de la guerra."],
 "questions": [
  q("¿Quién narra la novela?", ["Marcial", "Gabriel Araceli", "El almirante Nelson"], 1, "Gabriel cuenta sus recuerdos de juventud."),
  q("¿Por qué llamaban Medio-hombre a Marcial?", ["Porque era muy bajo", "Porque había perdido un brazo, una pierna y un ojo en combate", "Porque era muy joven"], 1, "Había sufrido muchas heridas de guerra."),
  q("¿En qué barco viaja Gabriel?", ["El Santísima Trinidad", "La Santa María", "El Victory"], 0, "Era el barco más grande de su época."),
  q("¿Qué aprende Gabriel con la experiencia de la batalla?", ["El dolor de la guerra y un nuevo sentido de patria", "Que la guerra es un juego", "A ser capitán"], 0, "La experiencia lo hace madurar.")]
},
{
 "slug": "la-navidad-en-las-montanas", "work": "La Navidad en las montañas", "author": "Ignacio Manuel Altamirano", "authorDeath": 1893,
 "catalogFile": "libros/gutenberg-10825.epub", "textSource": "https://www.gutenberg.org/ebooks/10825",
 "gradeMin": 7, "gradeMax": 11, "categories": ["Resúmenes", "Novela", "Literatura latinoamericana", "Navidad"],
 "description": "Resumen de la novela corta del mexicano Altamirano (1871): un capitán pasa la Nochebuena en un pueblo de montaña transformado por un cura ejemplar.",
 "body": [
  "La Navidad en las montañas es una novela corta del escritor mexicano Ignacio Manuel Altamirano, publicada en 1871.",
  "El narrador es un capitán del ejército liberal que viaja con sus soldados por las montañas de México en plena guerra civil. Es la víspera de Navidad, y, cansado y triste, recuerda las Nochebuenas felices de su infancia. Uno de sus soldados le avisa que más adelante va el cura del pueblo vecino, que le ofrece alojamiento.",
  "El capitán desconfía al saber que el cura es español, porque teme encontrar a un sacerdote fanático y enemigo de sus ideas. Pero pronto descubre a un hombre sencillo, culto y generoso. El cura le cuenta que llegó a esas montañas como misionero y que se ha convertido también en maestro de escuela, médico y consejero del pueblo. Ha enseñado a los campesinos nuevas técnicas de cultivo, ha impulsado la escuela y ha renunciado a cobrar dinero por bautizos, bodas o entierros. Gracias a su trabajo, el pueblo vive en paz y con prosperidad.",
  "Esa noche, en la cena de Nochebuena en casa del alcalde, el capitán conoce la historia de Carmen y Pablo. Años antes, Pablo era un joven ocioso, y cuando el gobierno pidió reclutas, el alcalde lo entregó al ejército. Carmen, que lo rechazaba, en el fondo lo amaba. Pablo sirvió con valentía, llegó a oficial y volvió transformado, pero vive solo en la montaña, trabajando la tierra y sin querer ver a nadie, porque cree que Carmen lo desprecia.",
  "El cura ha intentado que Pablo baje al pueblo esa noche. Cuando finalmente aparece, pálido y aún débil por sus heridas, Carmen le pide perdón y Pablo descubre que ella siempre lo quiso. Con la ayuda del capitán, los dos jóvenes se reconcilian y se anuncia su boda, mientras el pueblo celebra la llegada de la Navidad."
 ],
 "ideas": ["La educación, el trabajo y la generosidad pueden transformar una comunidad.",
           "El autor propone la reconciliación entre ideas distintas en un país dividido.",
           "Las personas pueden cambiar y merecen una segunda oportunidad."],
 "questions": [
  q("¿Quién narra la historia?", ["Un capitán del ejército", "El cura", "Carmen"], 0, "Un capitán liberal cuenta su Nochebuena en las montañas."),
  q("¿Por qué el capitán desconfiaba al principio del cura?", ["Porque era español y temía que fuera fanático", "Porque era muy joven", "Porque no hablaba"], 0, "Pero descubre a un hombre generoso."),
  q("¿Qué cambios hizo el cura en el pueblo?", ["Enseñó agricultura, impulsó la escuela y no cobraba por los sacramentos", "Construyó una fábrica", "Organizó un ejército"], 0, "Fue cura, maestro, médico y consejero."),
  q("¿Qué ocurre entre Carmen y Pablo al final?", ["Se reconcilian y se anuncia su boda", "Pablo se va para siempre", "Carmen se casa con otro"], 0, "La Nochebuena trae la reconciliación.")]
},
{
 "slug": "ariel", "work": "Ariel", "author": "José Enrique Rodó", "authorDeath": 1917,
 "catalogFile": "libros/gutenberg-22899.epub", "textSource": "https://www.gutenberg.org/ebooks/22899",
 "gradeMin": 10, "gradeMax": 11, "categories": ["Resúmenes", "Ensayo", "Literatura latinoamericana", "Pensamiento"],
 "description": "Resumen del ensayo del uruguayo Rodó (1900), dirigido a la juventud de América: idealismo, cultura y crítica del utilitarismo.",
 "body": [
  "Ariel es un ensayo del escritor uruguayo José Enrique Rodó, publicado en 1900 y dedicado a la juventud de América. Fue uno de los libros más leídos e influyentes de América Latina a comienzos del siglo veinte.",
  "El texto está presentado como la última lección de un viejo maestro, a quien sus alumnos llaman Próspero, como el sabio de la obra La tempestad de Shakespeare. En su aula hay una estatua de bronce de Ariel, el espíritu del aire de esa obra. Rodó usa los personajes de Shakespeare como símbolos: Ariel representa la parte noble del ser humano, la inteligencia, el sentimiento, el ideal y el gusto por la belleza; Calibán, en cambio, representa la sensualidad y la torpeza, lo material y lo puramente utilitario.",
  "Próspero se dirige a los jóvenes y les dice que la juventud es una fuerza de renovación y esperanza. Les pide que no renuncien a sus ideales y que cultiven todas las dimensiones de su espíritu, sin encerrarse en una sola actividad o especialidad. Defiende el valor del ocio dedicado a pensar, a crear y a contemplar, frente a una vida dedicada solo al trabajo y al provecho.",
  "Luego reflexiona sobre la democracia. Rodó la acepta, pero advierte que puede caer en la mediocridad si no se preocupa por la educación y por la formación de los mejores talentos, sin importar su origen social.",
  "Una parte importante del ensayo está dedicada a los Estados Unidos. Rodó admira su energía, su trabajo y su amor por la libertad, pero critica su utilitarismo, es decir, la tendencia a medirlo todo por la utilidad y el éxito material. Advierte a los latinoamericanos contra la tentación de imitar ese modelo sin pensar, y les pide conservar su propia identidad cultural, heredera de la tradición grecolatina.",
  "El ensayo termina cuando los jóvenes salen del aula y, al mirar el cielo estrellado, uno de ellos imagina que la multitud de la ciudad es como un surco donde el sembrador espera que germine la semilla del ideal."
 ],
 "ideas": ["Ariel simboliza el ideal y la espiritualidad; Calibán, el materialismo.",
           "Rodó invita a la juventud a cultivar una formación integral y a no renunciar a sus ideales.",
           "El ensayo defiende una identidad latinoamericana propia frente a la imitación de modelos ajenos."],
 "questions": [
  q("¿A quién está dirigido el ensayo Ariel?", ["A los gobernantes", "A la juventud de América", "A los niños pequeños"], 1, "Rodó lo dedicó a la juventud de América."),
  q("¿Qué representa Calibán en el ensayo?", ["El ideal y la belleza", "Lo material y utilitario", "La naturaleza salvaje"], 1, "Calibán simboliza la sensualidad y el utilitarismo."),
  q("¿De qué obra de Shakespeare toma Rodó sus símbolos?", ["Hamlet", "La tempestad", "Romeo y Julieta"], 1, "Próspero, Ariel y Calibán son personajes de La tempestad."),
  q("¿Qué critica Rodó del modelo de los Estados Unidos?", ["Su utilitarismo", "Su amor por la libertad", "Su energía"], 0, "Admira su energía pero critica su utilitarismo."),
  q("¿Sigue vigente hoy la pregunta de Rodó sobre la identidad cultural? ¿Por qué?", ["Sí, porque seguimos discutiendo qué imitar y qué conservar", "No, porque ya no existen culturas", "No tiene relación con nosotros"], 0, "Es una pregunta abierta para la discusión.")]
},
{
 "slug": "el-sombrero-de-tres-picos", "work": "El sombrero de tres picos", "author": "Pedro Antonio de Alarcón", "authorDeath": 1891,
 "catalogFile": "libros/gutenberg-29506.epub", "textSource": "https://www.gutenberg.org/ebooks/29506",
 "gradeMin": 9, "gradeMax": 11, "categories": ["Resúmenes", "Novela", "Literatura española", "Humor"],
 "description": "Resumen de la novela corta de Alarcón (1874): el molinero tío Lucas, la navarra Frasquita y un corregidor enamoradizo que termina burlado.",
 "body": [
  "El sombrero de tres picos es una novela corta de Pedro Antonio de Alarcón, publicada en 1874. Está inspirada en un romance popular y transcurre en una ciudad de Andalucía a comienzos del siglo diecinueve, cuando los corregidores todavía llevaban el sombrero de tres picos que da título al libro.",
  "El tío Lucas es un molinero bajo, feo y muy simpático, y su esposa, Frasquita, una navarra alta, hermosa y alegre. Se quieren mucho y confían el uno en el otro. Su molino, rodeado de una parra, es lugar de reunión de las autoridades del pueblo, que van a merendar y conversar.",
  "Entre ellos está el Corregidor, don Eugenio de Zúñiga, un hombre viejo, jorobado y presumido, que se ha encaprichado con Frasquita. Con la ayuda de su alguacil Garduña, prepara un plan: una noche hace que el alcalde del lugar, Juan López, arreste al tío Lucas con un pretexto, para quedarse a solas con la molinera.",
  "Pero todo sale mal para el Corregidor. Al llegar al molino cae en el caz, el canal de agua, y aparece empapado. Frasquita lo rechaza con energía, lo amenaza con el trabuco de la casa y sale a buscar a su marido. Mientras tanto, el tío Lucas logra escapar, regresa al molino y ve la ropa del Corregidor secándose junto al fuego. Creyendo que su mujer lo ha engañado, decide vengarse: se pone la ropa y el sombrero del Corregidor y se va a la ciudad, a la casa de la Corregidora.",
  "Al final, todos se encuentran en casa del Corregidor. La Corregidora, doña Mercedes, una señora digna e inteligente, deja en ridículo a su marido y aclara la situación. El tío Lucas y Frasquita comprueban que ninguno ha traicionado al otro y se reconcilian, mientras el Corregidor queda castigado y avergonzado."
 ],
 "ideas": ["La novela se burla del abuso de poder de las autoridades.",
           "La confianza y el amor del matrimonio vencen las trampas.",
           "Alarcón usa el humor y los enredos propios de la tradición popular."],
 "questions": [
  q("¿Quién es el tío Lucas?", ["Un corregidor", "Un molinero", "Un alguacil"], 1, "Es el molinero, esposo de Frasquita."),
  q("¿Qué pretende el Corregidor?", ["Comprar el molino", "Conquistar a Frasquita aprovechando su poder", "Ayudar al tío Lucas"], 1, "Abusa de su cargo para acercarse a la molinera."),
  q("¿Qué hace el tío Lucas al ver la ropa del Corregidor?", ["La quema", "Se la pone y va a casa de la Corregidora", "La devuelve"], 1, "Decide vengarse disfrazándose."),
  q("¿Qué critica la novela con humor?", ["El abuso de poder de las autoridades", "La vida de los molineros", "La comida andaluza"], 0, "El Corregidor queda en ridículo.")]
},
]
