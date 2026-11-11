# -*- coding: utf-8 -*-
"""Lote 2 — guiones ORIGINALES de audiobiografías (Macondo Digital, Comfasucre). Mismo formato que biores-bios.py."""

def q(prompt, options, answer, explanation):
    return {"prompt": prompt, "options": options, "answer": answer, "explanation": explanation}

BIOS2 = [
# ---------------------------------------------------------------- 1.º a 5.º
{
 "slug": "rafael-pombo-2", "name": "Rafael Pombo",
 "gradeMin": 1, "gradeMax": 4, "reviewNotes": "Sustituye a la audiobiografía de demostración de Rafael Pombo (voz de macOS), retirada.",
 "categories": ["Biografías", "Literatura colombiana", "Poesía", "Literatura infantil"],
 "description": "La vida del poeta bogotano que escribió El renacuajo paseador, La pobre viejecita y Simón el bobito. Texto sencillo para los más pequeños.",
 "body": [
  "¿Conoces a Rinrín Renacuajo, el que salió muy tieso y muy majo? ¿Y a la pobre viejecita, que no tenía nada que comer? Esos personajes los inventó un poeta colombiano llamado Rafael Pombo.",
  "Rafael Pombo nació en Bogotá el 7 de noviembre de 1833. Desde niño le encantaban las palabras, las rimas y los cuentos. Estudió para ser ingeniero, pero lo que más le gustaba era escribir poemas.",
  "Cuando era joven viajó a Estados Unidos, a la ciudad de Nueva York, para trabajar en la oficina que representaba a Colombia. Vivió allí muchos años. En esa ciudad conoció canciones y versos que los niños de habla inglesa cantaban desde hacía siglos.",
  "Pombo pensó que los niños de su país también merecían versos divertidos. Entonces escribió, en español, poemas llenos de humor y de animales que hablan. Así nacieron libros como Cuentos pintados para niños, con historias como Simón el bobito, Michín, El gato bandido y El renacuajo paseador.",
  "Muchos de esos poemas tienen una enseñanza. El renacuajo, por ejemplo, no obedece a su mamá y termina tragado por un pato. Pero Pombo enseñaba riendo, nunca regañando.",
  "Regresó a Colombia y siguió escribiendo durante toda su vida, también poemas para adultos. En 1905, la gente lo celebró con una gran fiesta en el Teatro Colón de Bogotá, donde lo coronaron como poeta nacional.",
  "Rafael Pombo murió en Bogotá el 5 de mayo de 1912. Pero sus personajes siguen vivos: los abuelos, los papás y los niños de Colombia los siguen recitando de memoria."
 ],
 "funFacts": ["Muchos de sus poemas para niños son adaptaciones libres de canciones infantiles inglesas que conoció en Nueva York.",
              "En la biblioteca de Macondo puedes leer El renacuajo paseador y La pobre viejecita."],
 "timeline": [{"year": 1833, "event": "Nace en Bogotá el 7 de noviembre."},
              {"year": 1855, "event": "Viaja a Nueva York como secretario de la legación de su país."},
              {"year": 1867, "event": "Se publican en Nueva York sus Cuentos pintados para niños."},
              {"year": 1905, "event": "Es coronado como poeta en el Teatro Colón de Bogotá."},
              {"year": 1912, "event": "Muere en Bogotá el 5 de mayo."}],
 "questions": [
  q("¿Qué personaje inventó Rafael Pombo?", ["Rinrín Renacuajo", "Pinocho", "Caperucita Roja"], 0, "Rinrín Renacuajo es el protagonista de El renacuajo paseador."),
  q("¿En qué ciudad nació Pombo?", ["Bogotá", "Cartagena", "Sincelejo"], 0, "Nació en Bogotá en 1833."),
  q("¿Dónde vivió muchos años y escribió sus cuentos pintados?", ["En Nueva York", "En París", "En Tokio"], 0, "Trabajó en Nueva York para su país."),
  q("¿Cómo enseñaba Pombo con sus poemas?", ["Haciendo reír", "Regañando", "Con exámenes"], 0, "Sus poemas enseñan con humor.")]
},
{
 "slug": "antonia-santos", "name": "Antonia Santos",
 "gradeMin": 3, "gradeMax": 5, "reviewNotes": "Menciona con delicadeza que fue condenada a muerte.",
 "categories": ["Biografías", "Historia de Colombia", "Mujeres en la historia", "Independencia"],
 "description": "La heroína santandereana que organizó una guerrilla campesina para ayudar a los patriotas poco antes de la Batalla de Boyacá.",
 "body": [
  "Antonia Santos Plata nació en 1782 en Pinchote, un pueblo de lo que hoy es el departamento de Santander. Su familia tenía una finca en el campo, y Antonia creció entre cultivos, caballos y montañas.",
  "Cuando Antonia era adulta, el territorio que hoy es Colombia vivía tiempos muy difíciles. Los patriotas habían declarado la independencia, pero el ejército del rey de España regresó y castigó con dureza a quienes querían la libertad. A esa época se le llama la Reconquista.",
  "Antonia no se quedó quieta. Con la ayuda de su familia y de campesinos de la región de Coromoro y Charalá, organizó un grupo de guerrilleros. Ella conseguía alimentos, caballos, armas y dinero, y daba refugio a los patriotas perseguidos. Además, la guerrilla vigilaba los caminos y avisaba de los movimientos de las tropas del rey.",
  "Esa ayuda fue muy importante en 1819, cuando el ejército de Simón Bolívar cruzó los Andes para liberar la Nueva Granada.",
  "Pero un día, alguien denunció a Antonia. Fue capturada y llevada a la villa del Socorro. Allí la condenaron a muerte, y murió el 28 de julio de 1819. Pocos días después, el 7 de agosto, los patriotas ganaron la Batalla de Boyacá.",
  "Hoy Antonia Santos es recordada como una heroína de la independencia. Su historia muestra que las mujeres del campo también fueron protagonistas de la libertad, aunque durante mucho tiempo los libros hablaran poco de ellas."
 ],
 "funFacts": ["Murió apenas diez días antes de la Batalla de Boyacá.",
              "Organizó una guerrilla campesina con su familia en la región de Coromoro y Charalá."],
 "timeline": [{"year": 1782, "event": "Nace en Pinchote, Santander."},
              {"year": 1816, "event": "Comienza la Reconquista española en la Nueva Granada."},
              {"year": 1819, "event": "Es capturada y muere en el Socorro el 28 de julio."},
              {"year": 1819, "event": "Los patriotas ganan la Batalla de Boyacá el 7 de agosto."}],
 "questions": [
  q("¿Qué organizó Antonia Santos?", ["Una guerrilla campesina", "Una escuela de música", "Un mercado"], 0, "Organizó una guerrilla para apoyar a los patriotas."),
  q("¿Cómo ayudaba Antonia a los patriotas?", ["Consiguiendo alimentos, caballos y refugio", "Cantando", "Vendiendo libros"], 0, "Apoyaba con recursos y refugio."),
  q("¿Qué batalla ganaron los patriotas pocos días después de su muerte?", ["La Batalla de Boyacá", "La Batalla de Trafalgar", "La Batalla de Pichincha"], 0, "Fue el 7 de agosto de 1819."),
  q("¿Qué nos enseña su historia?", ["Que las mujeres del campo también fueron protagonistas de la libertad", "Que la historia solo la hacen los reyes", "Que es mejor no ayudar"], 0, "Antonia fue una heroína campesina.")]
},
{
 "slug": "isaac-newton-para-ninos", "name": "Isaac Newton",
 "gradeMin": 3, "gradeMax": 5, "reviewNotes": None,
 "categories": ["Biografías", "Ciencia", "Matemáticas"],
 "description": "El científico inglés que explicó por qué caen las cosas, descubrió los colores escondidos en la luz y formuló las leyes del movimiento.",
 "body": [
  "Isaac Newton nació en Inglaterra, en una granja de un pueblito llamado Woolsthorpe, el día de Navidad de 1642. Era tan pequeño al nacer que nadie pensaba que sobreviviría. Pero sobrevivió, y llegó a ser uno de los científicos más importantes de la historia.",
  "De niño no era muy buen estudiante al principio, pero le encantaba construir cosas: relojes de sol, cometas y hasta un pequeño molino de viento que movía un ratón.",
  "Ya joven estudió en la Universidad de Cambridge. Cuando una epidemia obligó a cerrar la universidad, Newton volvió a la granja de su familia. Allí, en silencio, pensó y pensó. Se cuenta que, al ver caer una manzana de un árbol, se preguntó: ¿por qué las cosas caen hacia abajo y no hacia arriba? ¿Y por qué la Luna no se cae?",
  "Newton descubrió que existe una fuerza que atrae los objetos entre sí: la gravedad. La misma fuerza que hace caer la manzana mantiene a la Luna girando alrededor de la Tierra y a la Tierra alrededor del Sol.",
  "También explicó cómo se mueven las cosas con tres leyes que todavía se estudian en el colegio. Y con un prisma de vidrio demostró que la luz blanca del Sol está hecha de todos los colores del arcoíris.",
  "Newton murió en Londres en 1727, ya anciano y famoso. Fue enterrado en la abadía de Westminster, junto a reyes y poetas. Su vida nos enseña que las preguntas más sencillas pueden llevarnos a los descubrimientos más grandes."
 ],
 "funFacts": ["Construyó un pequeño molino de viento que funcionaba gracias a un ratón que corría dentro.",
              "Inventó un telescopio que usaba espejos en lugar de lentes."],
 "timeline": [{"year": 1642, "event": "Nace en Woolsthorpe, Inglaterra, el día de Navidad (según el calendario de la época)."},
              {"year": 1665, "event": "Una epidemia cierra Cambridge y Newton estudia en la granja familiar."},
              {"year": 1687, "event": "Publica su gran libro, los Principia, con la ley de la gravitación."},
              {"year": 1727, "event": "Muere en Londres."}],
 "questions": [
  q("¿Qué fuerza descubrió Newton?", ["La gravedad", "La electricidad", "El magnetismo"], 0, "La gravedad atrae los objetos entre sí."),
  q("¿Qué fruta aparece en la famosa historia de Newton?", ["Una manzana", "Un mango", "Una naranja"], 0, "Se cuenta que vio caer una manzana."),
  q("¿Qué descubrió con un prisma?", ["Que la luz blanca tiene todos los colores", "Que la Tierra es plana", "Que el agua hierve"], 0, "La luz se separa en los colores del arcoíris."),
  q("¿Qué nos enseña su historia?", ["Que las preguntas sencillas llevan a grandes descubrimientos", "Que no hay que preguntar", "Que la ciencia es aburrida"], 0, "Newton se hacía preguntas sobre todo.")]
},
{
 "slug": "louis-pasteur-para-ninos", "name": "Louis Pasteur",
 "gradeMin": 3, "gradeMax": 5, "reviewNotes": None,
 "categories": ["Biografías", "Ciencia", "Salud"],
 "description": "El químico francés que demostró que los microbios causan enfermedades, inventó la pasteurización y creó la vacuna contra la rabia.",
 "body": [
  "Louis Pasteur nació en Dole, un pueblo de Francia, el 27 de diciembre de 1822. Su papá era curtidor, es decir, trabajaba el cuero de los animales. Louis era un niño tranquilo al que le gustaba mucho dibujar.",
  "Con el tiempo descubrió que le apasionaba la química y se hizo científico. En su laboratorio pasaba horas mirando por el microscopio, un aparato que permite ver cosas diminutas.",
  "En esa época mucha gente creía que los seres vivos muy pequeños aparecían solos, de la nada. Pasteur demostró con experimentos que no era así: los microbios vienen de otros microbios, y viajan en el aire, en el agua y en las cosas sucias. También descubrió que algunos microbios causan enfermedades.",
  "Por eso hoy sabemos que es tan importante lavarse las manos, hervir el agua y limpiar las heridas.",
  "Pasteur inventó una manera de calentar el vino y la leche para eliminar los microbios dañinos sin estropear su sabor. A ese método lo llamamos pasteurización, en su honor. Seguramente has visto la palabra pasteurizada en una caja de leche.",
  "Su logro más famoso ocurrió en 1885. Un niño de nueve años llamado Joseph Meister había sido mordido por un perro con rabia, una enfermedad terrible. Pasteur probó en él una vacuna que había preparado, y el niño se salvó.",
  "Pasteur murió en 1895, cerca de París. El instituto que fundó, el Instituto Pasteur, sigue investigando para combatir enfermedades en todo el mundo."
 ],
 "funFacts": ["La palabra pasteurizada que aparece en las cajas de leche viene de su apellido.",
              "Joseph Meister, el niño que salvó, trabajó años después como portero del Instituto Pasteur."],
 "timeline": [{"year": 1822, "event": "Nace en Dole, Francia, el 27 de diciembre."},
              {"year": 1864, "event": "Desarrolla hacia esta época el método de calentamiento hoy llamado pasteurización."},
              {"year": 1885, "event": "Aplica con éxito la vacuna contra la rabia al niño Joseph Meister."},
              {"year": 1888, "event": "Se inaugura el Instituto Pasteur en París."},
              {"year": 1895, "event": "Muere cerca de París."}],
 "questions": [
  q("¿Qué demostró Pasteur sobre los microbios?", ["Que vienen de otros microbios y pueden causar enfermedades", "Que no existen", "Que son plantas"], 0, "Demostró que no aparecen de la nada."),
  q("¿Qué palabra viene de su apellido?", ["Pasteurizada", "Pastel", "Pasto"], 0, "La pasteurización lleva su nombre."),
  q("¿Contra qué enfermedad creó una vacuna?", ["La rabia", "La gripe", "El sarampión"], 0, "Salvó a Joseph Meister en 1885."),
  q("¿Qué costumbre de higiene se relaciona con sus descubrimientos?", ["Lavarse las manos", "Dormir tarde", "Comer dulces"], 0, "Lavarse las manos elimina microbios.")]
},
{
 "slug": "hans-christian-andersen-para-ninos", "name": "Hans Christian Andersen",
 "gradeMin": 1, "gradeMax": 4, "reviewNotes": None,
 "categories": ["Biografías", "Literatura infantil", "Cuentos"],
 "description": "El niño pobre de Dinamarca que se convirtió en el autor de El patito feo, La sirenita y El soldadito de plomo.",
 "body": [
  "Hans Christian Andersen nació en Odense, una ciudad de Dinamarca, el 2 de abril de 1805. Su familia era muy pobre. Su papá era zapatero y su mamá lavaba ropa ajena. Pero en su casa nunca faltaban los cuentos: su papá le leía historias y le construía teatrinos de títeres.",
  "Hans era un niño soñador, alto y flaco, que cantaba y recitaba todo el tiempo. Algunos niños se burlaban de él porque era distinto.",
  "A los catorce años se fue solo a Copenhague, la capital, porque quería ser actor. Al principio le fue muy mal: no tenía dinero ni amigos. Pero algunas personas vieron su talento y lo ayudaron a estudiar.",
  "Con los años, Andersen empezó a escribir cuentos para niños. Escribió más de ciento cincuenta. Algunos los conoces seguro: El patito feo, La sirenita, El soldadito de plomo, El traje nuevo del emperador y La vendedora de fósforos.",
  "Muchos piensan que El patito feo cuenta su propia historia: un pequeño que todos rechazan porque es diferente, y que al final descubre que es un hermoso cisne.",
  "Andersen viajó por muchos países y se hizo famoso en el mundo entero. Murió en Copenhague en 1875. Hoy, cada 2 de abril, el día de su nacimiento, se celebra el Día Internacional del Libro Infantil."
 ],
 "funFacts": ["El 2 de abril, día de su cumpleaños, es el Día Internacional del Libro Infantil.",
              "Escribió más de ciento cincuenta cuentos."],
 "timeline": [{"year": 1805, "event": "Nace en Odense, Dinamarca, el 2 de abril."},
              {"year": 1819, "event": "A los catorce años viaja solo a Copenhague."},
              {"year": 1835, "event": "Publica su primer cuadernillo de cuentos para niños."},
              {"year": 1875, "event": "Muere en Copenhague."}],
 "questions": [
  q("¿En qué país nació Andersen?", ["Dinamarca", "Colombia", "Egipto"], 0, "Nació en Odense, Dinamarca."),
  q("¿Cuál de estos cuentos escribió Andersen?", ["El patito feo", "El renacuajo paseador", "Pinocho"], 0, "El patito feo es uno de sus cuentos más famosos."),
  q("¿Qué día se celebra el Día Internacional del Libro Infantil?", ["El 2 de abril", "El 25 de diciembre", "El 20 de julio"], 0, "Es el día de su cumpleaños."),
  q("¿Por qué se dice que El patito feo se parece a su vida?", ["Porque de niño lo rechazaban por ser distinto", "Porque tenía patos", "Porque vivía en un lago"], 0, "Como el patito, Andersen fue rechazado y luego admirado.")]
},
{
 "slug": "galileo-galilei-para-ninos", "name": "Galileo Galilei",
 "gradeMin": 3, "gradeMax": 5, "reviewNotes": None,
 "categories": ["Biografías", "Ciencia", "Astronomía"],
 "description": "El científico italiano que apuntó un telescopio al cielo y descubrió las lunas de Júpiter y las montañas de la Luna.",
 "body": [
  "Galileo Galilei nació en Pisa, Italia, el 15 de febrero de 1564. Su papá era músico y le enseñó a hacer preguntas y a no creer algo solo porque lo dijera alguien importante.",
  "Galileo comenzó a estudiar medicina, pero se enamoró de las matemáticas. Se cuenta que, en la catedral de Pisa, observó una lámpara que se balanceaba y midió su movimiento con los latidos de su corazón. Así descubrió algo curioso sobre los péndulos.",
  "En 1609 supo que en Holanda habían inventado un aparato para ver de lejos. Galileo construyó el suyo, lo mejoró y lo apuntó hacia el cielo. Fue uno de los primeros en usar un telescopio para estudiar los astros.",
  "¡Lo que vio fue asombroso! La Luna tenía montañas y cráteres. Júpiter tenía cuatro lunas que giraban a su alrededor. Y la Vía Láctea estaba formada por miles y miles de estrellas.",
  "Sus observaciones apoyaban una idea que muchos no aceptaban: que la Tierra gira alrededor del Sol, y no el Sol alrededor de la Tierra. Por defender esa idea, Galileo tuvo problemas con las autoridades de su tiempo, y pasó sus últimos años sin poder salir de su casa.",
  "Aun así, siguió estudiando hasta su muerte, en 1642. Hoy sabemos que tenía razón. Las cuatro lunas que descubrió se llaman lunas galileanas en su honor."
 ],
 "funFacts": ["Las cuatro lunas grandes de Júpiter se llaman lunas galileanas.",
              "Se cuenta que midió el balanceo de una lámpara usando su propio pulso."],
 "timeline": [{"year": 1564, "event": "Nace en Pisa, Italia, el 15 de febrero."},
              {"year": 1609, "event": "Construye su telescopio y comienza a observar el cielo."},
              {"year": 1610, "event": "Anuncia el descubrimiento de cuatro lunas de Júpiter."},
              {"year": 1633, "event": "Es juzgado y obligado a vivir recluido en su casa."},
              {"year": 1642, "event": "Muere en Arcetri, cerca de Florencia."}],
 "questions": [
  q("¿Qué aparato usó Galileo para estudiar el cielo?", ["Un telescopio", "Un microscopio", "Un termómetro"], 0, "Fue uno de los primeros en apuntar un telescopio al cielo."),
  q("¿Qué descubrió alrededor de Júpiter?", ["Cuatro lunas", "Un anillo de fuego", "Nada"], 0, "Son las lunas galileanas."),
  q("¿Qué idea defendía Galileo?", ["Que la Tierra gira alrededor del Sol", "Que el Sol gira alrededor de la Luna", "Que la Tierra es plana"], 0, "Sus observaciones apoyaban esa idea."),
  q("¿Qué vio en la Luna?", ["Montañas y cráteres", "Ríos y selvas", "Ciudades"], 0, "Descubrió que la Luna tiene relieve.")]
},
{
 "slug": "alexander-von-humboldt-para-ninos", "name": "Alexander von Humboldt",
 "gradeMin": 3, "gradeMax": 5, "reviewNotes": None,
 "categories": ["Biografías", "Ciencia", "Naturaleza", "Caribe colombiano"],
 "description": "El explorador alemán que recorrió América, llegó a Cartagena, subió por el río Magdalena y visitó los volcanes de lodo de Turbaco.",
 "body": [
  "Alexander von Humboldt nació en Berlín, Alemania, el 14 de septiembre de 1769. De niño coleccionaba piedras, insectos y plantas, y su familia lo llamaba el pequeño boticario.",
  "Cuando creció soñaba con conocer tierras lejanas. En 1799, junto con su amigo, el botánico francés Aimé Bonpland, viajó a América. Recorrieron Venezuela, Cuba, Colombia, Ecuador, Perú y México durante cinco años.",
  "En 1801 llegaron a Cartagena de Indias. Cerca de allí, en Turbaco, Humboldt se asombró con unos pequeños volcanes que, en lugar de lava, echan lodo. Luego viajó en canoa por el río Magdalena, entre selvas llenas de monos, loros y caimanes, y subió por los caminos de la montaña hasta Santafé, donde conoció al sabio José Celestino Mutis.",
  "Humboldt lo medía todo: la temperatura, la altura de las montañas, la forma del terreno. Dibujaba plantas y animales y escribía miles de notas. En Ecuador intentó subir al volcán Chimborazo y llegó más alto que ninguna persona conocida de su tiempo.",
  "Una de sus grandes ideas fue que en la naturaleza todo está conectado: el clima, las plantas, los animales y las personas. Por eso hoy lo consideran uno de los padres de la ecología.",
  "Humboldt murió en Berlín en 1859. En América, muchos lugares, animales y hasta una corriente marina del océano Pacífico llevan su nombre."
 ],
 "funFacts": ["Visitó los volcanes de lodo de Turbaco, cerca de Cartagena.",
              "Una corriente fría del océano Pacífico se llama corriente de Humboldt."],
 "timeline": [{"year": 1769, "event": "Nace en Berlín el 14 de septiembre."},
              {"year": 1799, "event": "Comienza su viaje por América con Aimé Bonpland."},
              {"year": 1801, "event": "Llega a Cartagena, recorre el Magdalena y visita a Mutis en Santafé."},
              {"year": 1802, "event": "Intenta subir al Chimborazo, en Ecuador."},
              {"year": 1859, "event": "Muere en Berlín."}],
 "questions": [
  q("¿Qué ciudad del Caribe colombiano visitó Humboldt en 1801?", ["Cartagena de Indias", "Riohacha", "Montería"], 0, "Llegó a Cartagena y visitó Turbaco."),
  q("¿Qué tienen de especial los volcanes de Turbaco?", ["Echan lodo en lugar de lava", "Son de hielo", "Echan agua caliente"], 0, "Son volcanes de lodo."),
  q("¿Por qué lo consideran un padre de la ecología?", ["Porque enseñó que en la naturaleza todo está conectado", "Porque inventó el reciclaje", "Porque plantó un bosque"], 0, "Relacionó clima, plantas, animales y personas."),
  q("¿A qué sabio conoció en Santafé?", ["José Celestino Mutis", "Isaac Newton", "Leonardo da Vinci"], 0, "Mutis dirigía la Expedición Botánica.")]
},
{
 "slug": "juana-azurduy-para-ninos", "name": "Juana Azurduy",
 "gradeMin": 4, "gradeMax": 5, "reviewNotes": "Menciona la muerte de sus hijos durante la guerra, sin detalles.",
 "categories": ["Biografías", "Mujeres en la historia", "Independencia", "América Latina", "Pueblos indígenas"],
 "description": "La guerrera nacida en Chuquisaca (hoy Sucre, Bolivia) que luchó por la independencia junto a combatientes indígenas y mestizos.",
 "body": [
  "Juana Azurduy nació el 12 de julio de 1780 cerca de la ciudad de Chuquisaca, que hoy se llama Sucre y es la capital de Bolivia. En esa época la región se llamaba Alto Perú y era gobernada por el rey de España.",
  "De niña aprendió a montar a caballo y a hablar quechua y aimara, las lenguas de los pueblos indígenas de su tierra. Quedó huérfana muy joven, y vivió un tiempo en un convento, pero ella prefería la vida libre del campo.",
  "Se casó con Manuel Ascencio Padilla, un hombre que también soñaba con la independencia. Cuando comenzó la lucha, en 1809, los dos se unieron a los patriotas. Juana organizó a miles de combatientes, muchos de ellos indígenas, y los dirigió a caballo en numerosas batallas.",
  "La guerra fue muy dura para ella: perdió a su esposo y a varios de sus hijos. Aun así, nunca se rindió. Por su valentía, recibió el grado de teniente coronel, algo muy raro para una mujer de su tiempo.",
  "En 1825, cuando Bolivia ya era independiente, Simón Bolívar fue a visitarla. Se cuenta que dijo que el país debería llevar el apellido de ella y no el suyo, porque Juana lo había liberado.",
  "Juana Azurduy murió en 1862, siendo ya anciana y muy pobre. Mucho tiempo después, Argentina y Bolivia la nombraron generala y mariscal en reconocimiento a su lucha."
 ],
 "funFacts": ["Hablaba quechua y aimara, las lenguas indígenas de su región.",
              "Nació cerca de Chuquisaca, la ciudad que hoy se llama Sucre, igual que nuestro departamento."],
 "timeline": [{"year": 1780, "event": "Nace cerca de Chuquisaca (hoy Sucre, Bolivia) el 12 de julio."},
              {"year": 1809, "event": "Comienza la lucha por la independencia en el Alto Perú."},
              {"year": 1816, "event": "Recibe el grado de teniente coronel."},
              {"year": 1825, "event": "Simón Bolívar la visita."},
              {"year": 1862, "event": "Muere en Chuquisaca (hoy Sucre) el 25 de mayo."}],
 "questions": [
  q("¿Cómo se llama hoy la ciudad donde nació Juana?", ["Sucre", "Bogotá", "Lima"], 0, "Chuquisaca hoy se llama Sucre."),
  q("¿Qué lenguas indígenas hablaba?", ["Quechua y aimara", "Inglés y francés", "Wayuunaiki y zenú"], 0, "Hablaba las lenguas de su región."),
  q("¿Qué grado militar recibió?", ["Teniente coronel", "Soldado raso", "Reina"], 0, "Fue algo muy raro para una mujer de su época."),
  q("¿Quién la visitó en 1825?", ["Simón Bolívar", "Napoleón", "Cristóbal Colón"], 0, "Bolívar admiraba su valentía.")]
},
{
 "slug": "lucho-bermudez-para-ninos", "name": "Lucho Bermúdez",
 "gradeMin": 3, "gradeMax": 6, "reviewNotes": "Persona fallecida en 1994: no se citan letras de sus canciones (no están en dominio público).",
 "categories": ["Biografías", "Música", "Caribe colombiano", "Montes de María"],
 "description": "El músico de El Carmen de Bolívar, en los Montes de María, que llevó el porro y la cumbia a las grandes orquestas.",
 "body": [
  "Luis Eduardo Bermúdez Acosta, a quien todos llamaron Lucho Bermúdez, nació el 25 de enero de 1912 en El Carmen de Bolívar, un pueblo de los Montes de María, muy cerca de nuestro departamento de Sucre.",
  "Desde muy niño la música lo rodeaba: en las fiestas del pueblo sonaban las bandas, con sus clarinetes, trompetas y tambores. Lucho aprendió a tocar varios instrumentos, y su favorito fue el clarinete. Siendo todavía muy joven ya tocaba en bandas de la región.",
  "Lucho tenía un sueño: que la música de la costa Caribe, como el porro, la cumbia y la gaita, sonara en todas partes. En esa época, en las grandes ciudades del interior se bailaban sobre todo ritmos extranjeros.",
  "Formó orquestas en Cartagena, y luego viajó a Bogotá y a Medellín. Allí, con músicos elegantemente vestidos, tocó porros y cumbias en los clubes y hoteles más importantes. ¡Todo el mundo se puso a bailar música costeña!",
  "Compuso muchísimas canciones, como Colombia tierra querida, Carmen de Bolívar, Salsipuedes y San Fernando. Muchas las cantaba Matilde Díaz, una gran cantante que fue también su esposa.",
  "Lucho Bermúdez murió en Bogotá en 1994. Hoy se le recuerda como uno de los músicos más importantes de Colombia, el que ayudó a que la música del Caribe se convirtiera en música de todo el país."
 ],
 "funFacts": ["Su instrumento favorito era el clarinete.",
              "Escribió una canción dedicada a su pueblo natal: Carmen de Bolívar."],
 "timeline": [{"year": 1912, "event": "Nace en El Carmen de Bolívar el 25 de enero."},
              {"year": 1940, "event": "Hacia esta época lleva su orquesta de música costeña a Bogotá."},
              {"year": 1994, "event": "Muere en Bogotá el 23 de abril."}],
 "questions": [
  q("¿En qué pueblo de los Montes de María nació Lucho Bermúdez?", ["El Carmen de Bolívar", "Tolú", "Corozal"], 0, "Nació en El Carmen de Bolívar."),
  q("¿Cuál era su instrumento favorito?", ["El clarinete", "El violín", "El piano"], 0, "Tocaba el clarinete."),
  q("¿Qué ritmos llevó a las grandes orquestas?", ["El porro y la cumbia", "El rock y el jazz", "El tango"], 0, "Popularizó la música del Caribe."),
  q("¿Quién cantaba muchas de sus canciones?", ["Matilde Díaz", "Shakira", "Celia Cruz"], 0, "Matilde Díaz fue su cantante y esposa.")]
},
# ---------------------------------------------------------------- 6.º a 11.º
{
 "slug": "manuel-quintin-lame", "name": "Manuel Quintín Lame",
 "gradeMin": 7, "gradeMax": 11, "reviewNotes": "Tema histórico de conflicto por la tierra y represión; un grupo armado posterior (1984) usó su nombre, lo cual no se menciona.",
 "categories": ["Biografías", "Historia de Colombia", "Pueblos indígenas", "Derechos humanos"],
 "description": "El líder nasa del Cauca que aprendió a leer por su cuenta y dedicó su vida a defender las tierras y los derechos de los pueblos indígenas.",
 "body": [
  "Manuel Quintín Lame nació el 26 de octubre de 1880 en la región de Popayán, en el Cauca, en una familia del pueblo nasa, también llamado paez. Su familia era terrajera: para poder vivir y cultivar en una parcela de una hacienda, debía trabajar gratis para el dueño varios días al mes. Ese sistema, llamado terraje, mantenía a muchas familias indígenas en la pobreza.",
  "De niño Manuel no pudo ir a la escuela. Pero tenía un enorme deseo de aprender. Se cuenta que aprendió a leer y escribir prácticamente solo, con ayuda de un tío y de los libros que conseguía. Con el tiempo estudió leyes por su cuenta, en especial las normas sobre los resguardos, las tierras comunitarias de los pueblos indígenas reconocidas desde la época colonial.",
  "Siendo joven, prestó servicio militar y conoció otras regiones del país. Al volver al Cauca comprendió que los indígenas estaban perdiendo sus tierras y sufrían abusos. Decidió dedicar su vida a defenderlos.",
  "Desde 1910 recorrió las comunidades del Cauca y del Tolima explicando a la gente sus derechos. Reclamó la devolución de los resguardos, el fin del terraje y el respeto a los cabildos, las autoridades propias de las comunidades. Su movimiento creció tanto que a las protestas de esos años se les llamó la Quintinada.",
  "Los hacendados y las autoridades lo vieron como una amenaza. Quintín Lame fue encarcelado muchas veces y pasó largos años en prisión. Pero cada vez que salía, continuaba su lucha, sobre todo usando la ley: presentaba memoriales, demandas y cartas a las autoridades.",
  "Más tarde se estableció en Ortega, en el Tolima, donde ayudó a reconstruir el resguardo indígena. Allí escribió un libro extraordinario, terminado en 1939, que tituló Los pensamientos del indio que se educó dentro de las selvas colombianas. En él defiende la sabiduría de los pueblos indígenas, aprendida de la naturaleza, frente a quienes los despreciaban.",
  "Quintín Lame insistía en que la lucha debía hacerse con la palabra y con el conocimiento. Por eso animaba a los jóvenes indígenas a aprender a leer y escribir, a conocer las leyes del país y a no avergonzarse de su origen. En su libro afirma que la naturaleza había sido su gran maestra: el monte, los ríos y los animales le habían enseñado a pensar. Para él, la sabiduría no estaba solo en las universidades, sino también en la experiencia de los pueblos que viven en contacto con la tierra. Esa idea, que entonces parecía extraña a muchos, hoy es reconocida en el respeto a los saberes ancestrales y a la educación propia de los pueblos indígenas.",
  "Manuel Quintín Lame murió en Ortega el 7 de octubre de 1967. Su ejemplo inspiró a las organizaciones indígenas que surgieron después, y muchas de sus luchas fueron reconocidas en la Constitución de 1991, que protege los resguardos y la diversidad étnica y cultural de Colombia."
 ],
 "funFacts": ["Aprendió a leer y escribir prácticamente por su cuenta, y luego estudió leyes de forma autodidacta.",
              "Su libro se titula Los pensamientos del indio que se educó dentro de las selvas colombianas."],
 "timeline": [{"year": 1880, "event": "Nace en la región de Popayán, Cauca, el 26 de octubre."},
              {"year": 1914, "event": "Hacia estos años encabeza las protestas conocidas como la Quintinada."},
              {"year": 1939, "event": "Termina su libro Los pensamientos del indio que se educó dentro de las selvas colombianas."},
              {"year": 1967, "event": "Muere en Ortega, Tolima, el 7 de octubre."},
              {"year": 1991, "event": "La nueva Constitución reconoce la diversidad étnica y protege los resguardos."}],
 "questions": [
  q("¿A qué pueblo indígena pertenecía Quintín Lame?", ["Nasa (paez)", "Wayuu", "Zenú"], 0, "Era nasa, del Cauca."),
  q("¿Qué era el terraje?", ["Trabajar gratis para el hacendado a cambio de una parcela", "Un tipo de cultivo", "Una fiesta indígena"], 0, "Ese sistema empobrecía a las familias indígenas."),
  q("¿Qué defendía principalmente?", ["Los resguardos y los derechos indígenas", "La minería", "Los impuestos"], 0, "Reclamaba las tierras comunitarias."),
  q("¿Qué herramienta usó sobre todo en su lucha?", ["La ley: memoriales, demandas y cartas", "La música", "El comercio"], 0, "Estudió leyes por su cuenta."),
  q("¿Qué relación tiene su lucha con la Constitución de 1991?", ["La Constitución reconoció derechos que él reclamaba", "Ninguna", "La Constitución eliminó los resguardos"], 0, "Protege resguardos y diversidad étnica.")]
},
{
 "slug": "luis-carlos-lopez", "name": "Luis Carlos López",
 "gradeMin": 7, "gradeMax": 11, "reviewNotes": "Autor fallecido en 1950: sus poemas aún no están en dominio público en Colombia; no se citan versos.",
 "categories": ["Biografías", "Literatura colombiana", "Caribe colombiano", "Poesía"],
 "description": "El poeta cartagenero, apodado el Tuerto, que retrató con humor e ironía la vida de los pueblos y de su ciudad natal.",
 "body": [
  "Luis Carlos López nació en Cartagena de Indias el 11 de junio de 1879. Su familia era numerosa y él estudió en Cartagena, aunque nunca terminó una carrera universitaria. Desde joven lo apodaron el Tuerto, por un leve estrabismo en uno de sus ojos, aunque en realidad veía con los dos.",
  "En su juventud vivió las guerras civiles de finales del siglo diecinueve, y trabajó en diferentes oficios, entre ellos el comercio. Pero su verdadera vocación era la poesía.",
  "En 1908 publicó su primer libro, De mi villorrio. Un villorrio es un pueblo pequeño y pobre. Al año siguiente publicó Posturas difíciles, y en 1920, Por el atajo. En esos libros, López hizo algo que pocos poetas de su tiempo se atrevían a hacer: en lugar de escribir sobre princesas, cisnes y jardines lejanos, como era la moda del modernismo, escribió sobre la vida cotidiana de los pueblos de la costa.",
  "Por sus versos desfilan el alcalde, el cura, el boticario, el barbero, las solteronas, los burros y los perros de la plaza. Todo lo describe con un humor irónico y a veces amargo, que se burla de la pereza, la hipocresía y la vanidad de las pequeñas sociedades provincianas. Pero detrás de la burla hay ternura por su gente.",
  "Su poema más famoso es un soneto dedicado a Cartagena, en el que compara a su ciudad con unos zapatos viejos: gastados, pero queridos, porque nos hemos acostumbrado a ellos. Por eso en Cartagena, junto a las murallas, hay un monumento con un par de enormes zapatos viejos en su honor.",
  "Su estilo era muy distinto del de los poetas de su generación. Usaba palabras sencillas, a veces de la conversación diaria, y comparaciones inesperadas que hacían reír. Pero no se quedaba en la burla: con sus versos mostraba la pobreza, el aburrimiento y el atraso de muchos pueblos olvidados por el progreso. Algunos críticos de su época no lo tomaron en serio porque su poesía parecía demasiado chistosa. Con el tiempo, en cambio, se entendió que su humor era una forma valiente de decir verdades incómodas. Muchos poetas colombianos posteriores reconocieron en él a un maestro que les enseñó que la poesía también puede hablar de lo cotidiano.",
  "López también fue cónsul de Colombia en la ciudad de Baltimore, en Estados Unidos, durante algunos años. Después regresó a su ciudad, donde vivió con sencillez hasta su muerte, el 30 de octubre de 1950.",
  "Hoy se le considera uno de los poetas más originales de Colombia, precursor de una poesía más cercana al habla de la gente y a la realidad cotidiana."
 ],
 "funFacts": ["En Cartagena hay un monumento a los zapatos viejos, inspirado en su soneto a la ciudad.",
              "Lo llamaban el Tuerto, aunque veía con los dos ojos."],
 "timeline": [{"year": 1879, "event": "Nace en Cartagena el 11 de junio."},
              {"year": 1908, "event": "Publica De mi villorrio."},
              {"year": 1909, "event": "Publica Posturas difíciles."},
              {"year": 1920, "event": "Publica Por el atajo."},
              {"year": 1950, "event": "Muere en Cartagena el 30 de octubre."}],
 "questions": [
  q("¿Cuál era el apodo de Luis Carlos López?", ["El Tuerto", "El Sabio", "El Libertador"], 0, "Lo llamaban el Tuerto por un leve estrabismo."),
  q("¿Sobre qué escribía principalmente?", ["La vida cotidiana de los pueblos de la costa", "Princesas y cisnes", "Viajes espaciales"], 0, "Retrató la vida provinciana con ironía."),
  q("¿Con qué objeto compara a Cartagena en su soneto más famoso?", ["Con unos zapatos viejos", "Con un sombrero", "Con un barco"], 0, "Hay un monumento a los zapatos viejos en Cartagena."),
  q("¿Qué recurso usa López para criticar a la sociedad?", ["El humor irónico", "La tragedia", "La ciencia ficción"], 0, "Su ironía se burla de la hipocresía y la vanidad.")]
},
{
 "slug": "soledad-acosta-de-samper", "name": "Soledad Acosta de Samper",
 "gradeMin": 7, "gradeMax": 11, "reviewNotes": None,
 "categories": ["Biografías", "Literatura colombiana", "Mujeres en la historia", "Periodismo"],
 "description": "Novelista, historiadora y periodista bogotana del siglo XIX, fundadora de revistas para mujeres y una de las escritoras más prolíficas de Colombia.",
 "body": [
  "Soledad Acosta Kemble nació en Bogotá el 5 de mayo de 1833. Su padre era el general Joaquín Acosta, militar, geógrafo e historiador, y su madre, Caroline Kemble, una mujer de origen inglés. Gracias a ellos recibió una educación excepcional para una niña de su época.",
  "Siendo adolescente vivió con su madre en Halifax, en Canadá, y luego en París. Aprendió varios idiomas y leyó a los grandes autores de Europa. Al regresar a Colombia llevaba consigo una curiosidad intelectual enorme.",
  "En 1855 se casó con el escritor y político José María Samper. Desde entonces firmó como Soledad Acosta de Samper. Juntos vivieron en Europa y en Perú, y escribieron y editaron periódicos.",
  "Soledad escribió muchísimo: novelas, cuentos, obras de teatro, biografías, libros de historia y cientos de artículos. Una de sus narraciones más conocidas es Dolores, la historia de una joven que enferma y debe apartarse de la sociedad. En muchas de sus obras reflexionó sobre la situación de las mujeres, su educación y su papel en la vida pública.",
  "Fue también una periodista pionera. En 1878 fundó la revista La Mujer, considerada la primera publicación en Colombia dirigida por una mujer y escrita en buena parte por mujeres. Más tarde creó otras revistas, en las que publicaba artículos de historia, ciencia, viajes y consejos prácticos, porque pensaba que las mujeres debían tener acceso a todo el conocimiento.",
  "Soledad tuvo cuatro hijas, y vivió también momentos muy difíciles. Las guerras civiles del siglo diecinueve afectaron también a su familia, y en tiempos de dificultad ella ayudó a sostener el hogar con su trabajo de escritora, traductora y editora. Escribir no era para ella un pasatiempo, sino un oficio serio y una forma de ganarse la vida, algo muy poco común para una mujer de su clase social en esa época. Llevó además un diario personal durante su juventud, que hoy permite conocer cómo pensaba y sentía una joven bogotana de mediados del siglo diecinueve. En ese diario anotaba sus lecturas, sus dudas y sus sueños de escribir.",
  "Como historiadora, escribió biografías de próceres y estudios sobre la conquista y la colonia. En 1892 representó a Colombia en un congreso internacional celebrado en España con motivo de los cuatrocientos años del viaje de Colón, algo extraordinario para una mujer de su tiempo.",
  "Soledad Acosta de Samper murió en Bogotá el 17 de marzo de 1913. Durante mucho tiempo su obra fue poco conocida, pero hoy se la reconoce como una de las escritoras más importantes del siglo diecinueve en América Latina."
 ],
 "funFacts": ["Fundó en 1878 la revista La Mujer, considerada la primera en Colombia dirigida por una mujer.",
              "Su esposo, José María Samper, es autor de Viajes de un colombiano en Europa, que está en la biblioteca de Macondo."],
 "timeline": [{"year": 1833, "event": "Nace en Bogotá el 5 de mayo."},
              {"year": 1855, "event": "Se casa con José María Samper."},
              {"year": 1878, "event": "Funda la revista La Mujer."},
              {"year": 1892, "event": "Representa a Colombia en un congreso internacional en España."},
              {"year": 1913, "event": "Muere en Bogotá el 17 de marzo."}],
 "questions": [
  q("¿Qué revista fundó Soledad Acosta en 1878?", ["La Mujer", "El Tiempo", "Semana"], 0, "Fue pionera del periodismo femenino en Colombia."),
  q("¿Qué tipo de obras escribió?", ["Novelas, cuentos, historia y artículos", "Solo poemas de amor", "Solo recetas"], 0, "Fue muy prolífica en muchos géneros."),
  q("¿Qué tema le preocupaba especialmente?", ["La educación y el papel de las mujeres", "Los deportes", "La industria del petróleo"], 0, "Reflexionó mucho sobre la situación de las mujeres."),
  q("¿Por qué su presencia en el congreso de 1892 fue extraordinaria?", ["Porque pocas mujeres participaban en la vida intelectual pública", "Porque viajó en avión", "Porque era una niña"], 0, "Era algo muy raro en su época.")]
},
{
 "slug": "pedro-romero", "name": "Pedro Romero",
 "gradeMin": 6, "gradeMax": 11, "reviewNotes": "Hay pocos documentos sobre su vida; las fechas de nacimiento y muerte son inciertas y así se indica.",
 "categories": ["Biografías", "Historia de Colombia", "Caribe colombiano", "Afrocolombianidad", "Independencia"],
 "description": "El artesano afrodescendiente del barrio Getsemaní que encabezó a los lanceros populares en la independencia absoluta de Cartagena, el 11 de noviembre de 1811.",
 "body": [
  "Cuando pensamos en la independencia, solemos imaginar generales a caballo y señores con levita. Pero en Cartagena de Indias, uno de sus protagonistas fue un artesano: Pedro Romero.",
  "Pedro Romero había nacido en Cuba, en la región de Matanzas, en la segunda mitad del siglo dieciocho; no conocemos con certeza la fecha. Era un hombre afrodescendiente, de los que entonces llamaban mulatos o pardos. Llegó a Cartagena y se estableció en el barrio de Getsemaní, un barrio popular de artesanos, pescadores y trabajadores, al lado del centro amurallado.",
  "Allí trabajó como herrero y fundidor, y llegó a tener un taller importante. Era muy respetado por sus vecinos, que lo veían como un líder natural.",
  "En 1810, cuando comenzaron los movimientos de independencia, en Cartagena se formó una junta de gobierno. Pero muchos de sus miembros, de familias ricas, dudaban: no querían romper del todo con España. Los habitantes de Getsemaní, en cambio, querían la independencia total.",
  "El 11 de noviembre de 1811, Pedro Romero y otros líderes populares reunieron a cientos de hombres armados con lanzas, a quienes se conoció como los lanceros de Getsemaní. Marcharon hacia el lugar donde estaba reunida la junta y exigieron que se declarara la independencia absoluta de Cartagena. Bajo esa presión, la junta firmó el Acta de Independencia. Cartagena se convirtió así en una de las primeras ciudades de la actual Colombia en proclamar su independencia total de España.",
  "Aquella jornada no fue solo un acto político. Para los artesanos, pescadores y trabajadores de Getsemaní, muchos de ellos afrodescendientes, la independencia significaba también la esperanza de una sociedad con menos privilegios para unos pocos. En la Cartagena colonial, las personas eran clasificadas según su origen y el color de su piel, y esa clasificación decidía qué oficios podían tener y qué derechos les correspondían. La participación de Pedro Romero y de los lanceros mostró que el pueblo llano también quería decidir su destino. La Constitución del Estado de Cartagena, aprobada en 1812, recogió algunas ideas de igualdad ante la ley, aunque la esclavitud no fue abolida entonces.",
  "Pedro Romero siguió participando en la defensa de la ciudad. En 1815, las tropas españolas del general Pablo Morillo sitiaron Cartagena durante más de cien días; muchísimos habitantes murieron de hambre y enfermedad. Cuando la ciudad cayó, muchos patriotas huyeron por mar. Se cree que Pedro Romero murió poco después en el exilio, en el Caribe.",
  "Durante mucho tiempo, los libros de historia hablaron poco de él. Hoy se reconoce que la independencia de Cartagena fue también obra del pueblo afrodescendiente y artesano de Getsemaní. Cada 11 de noviembre, en las fiestas de independencia de Cartagena, se recuerda aquella jornada."
 ],
 "funFacts": ["Las fiestas del 11 de noviembre en Cartagena conmemoran la independencia que impulsaron los lanceros de Getsemaní.",
              "Era herrero y fundidor en el barrio popular de Getsemaní."],
 "timeline": [{"year": 1810, "event": "Se forma una junta de gobierno en Cartagena."},
              {"year": 1811, "event": "El 11 de noviembre, los lanceros de Getsemaní presionan la declaración de independencia absoluta."},
              {"year": 1815, "event": "Sitio de Cartagena por las tropas de Pablo Morillo."},
              {"year": 1816, "event": "Fecha aproximada de su muerte en el exilio."}],
 "questions": [
  q("¿En qué barrio de Cartagena vivía Pedro Romero?", ["Getsemaní", "Bocagrande", "Manga"], 0, "Getsemaní era un barrio de artesanos."),
  q("¿Qué oficio tenía?", ["Herrero y fundidor", "Médico", "Sacerdote"], 0, "Tenía un taller de herrería."),
  q("¿Qué ocurrió el 11 de noviembre de 1811?", ["Se declaró la independencia absoluta de Cartagena", "Se fundó Cartagena", "Llegó Colón"], 0, "Los lanceros de Getsemaní presionaron la declaración."),
  q("¿Qué nos enseña la historia de Pedro Romero sobre la independencia?", ["Que también fue obra del pueblo afrodescendiente y artesano", "Que solo participaron los ricos", "Que no hubo independencia"], 0, "El pueblo de Getsemaní fue protagonista.")]
},
{
 "slug": "agustin-codazzi", "name": "Agustín Codazzi",
 "gradeMin": 6, "gradeMax": 11, "reviewNotes": None,
 "categories": ["Biografías", "Ciencia", "Geografía", "Historia de Colombia", "Caribe colombiano"],
 "description": "El militar y cartógrafo italiano que dirigió la Comisión Corográfica y dibujó los primeros mapas detallados de Colombia; murió cerca de Valledupar.",
 "body": [
  "Agustín Codazzi nació en Lugo, una pequeña ciudad de Italia, el 12 de julio de 1793. Muy joven se hizo soldado y estudió artillería y matemáticas. Combatió en los ejércitos de Napoleón, en Europa, donde aprendió a levantar planos y a medir el terreno.",
  "Tras la caída de Napoleón, buscó aventuras en América. Durante unos años navegó por el Caribe al servicio de los corsarios que apoyaban la independencia de las colonias españolas. Después regresó a Italia, pero el continente americano lo había conquistado.",
  "En 1826 volvió y se estableció en Venezuela. Allí trabajó durante años en un enorme proyecto: dibujar el mapa completo del país. Recorrió llanos, selvas y montañas, y en 1840 publicó un atlas y una geografía de Venezuela que fueron admirados en Europa.",
  "Por problemas políticos tuvo que salir de Venezuela, y en 1849 llegó a la Nueva Granada, como se llamaba entonces Colombia. El gobierno lo contrató para dirigir la Comisión Corográfica, una expedición científica cuyo objetivo era conocer y describir todo el territorio nacional: sus ríos, montañas, caminos, recursos, pueblos y costumbres.",
  "Desde 1850, Codazzi y sus compañeros recorrieron a lomo de mula, a pie y en canoa casi todas las provincias. Lo acompañaban, en distintos momentos, el escritor Manuel Ancízar, el botánico José Jerónimo Triana y pintores como Carmelo Fernández y Manuel María Paz, que hicieron acuarelas de paisajes y de personas de cada región. Esas láminas son hoy un tesoro para conocer cómo era el país a mediados del siglo diecinueve.",
  "El trabajo no era fácil. Los miembros de la comisión enfrentaban lluvias torrenciales, caminos de barro, ríos crecidos, fiebres y largas temporadas lejos de sus familias. Cada noche Codazzi revisaba sus cálculos a la luz de una vela y pasaba en limpio sus apuntes. Manuel Ancízar, por su parte, escribió un libro muy famoso sobre sus viajes por las provincias del norte, titulado Peregrinación de Alpha, en el que describe paisajes, pueblos y costumbres. Gracias a esos esfuerzos, por primera vez los colombianos pudieron ver en un mapa cómo era realmente su país.",
  "Codazzi dibujaba mapas con una precisión asombrosa para su época. Medía alturas, calculaba distancias y anotaba la riqueza de cada lugar. También propuso caminos y obras para unir las regiones.",
  "En 1859, mientras trabajaba en la región del norte del país, enfermó de fiebres. Murió el 7 de febrero de ese año en Espíritu Santo, un pequeño poblado cerca de Valledupar. Ese lugar hoy es el municipio de Agustín Codazzi, en el departamento del Cesar.",
  "Su trabajo fue la base de los primeros mapas modernos de Colombia. Por eso la entidad que hoy elabora los mapas oficiales del país se llama Instituto Geográfico Agustín Codazzi."
 ],
 "funFacts": ["El municipio de Agustín Codazzi, en el Cesar, lleva su nombre y está donde él murió.",
              "La entidad que hace los mapas oficiales de Colombia es el Instituto Geográfico Agustín Codazzi.",
              "Los pintores de la Comisión Corográfica dejaron cientos de acuarelas de paisajes y personas del país."],
 "timeline": [{"year": 1793, "event": "Nace en Lugo, Italia, el 12 de julio."},
              {"year": 1840, "event": "Publica el atlas y la geografía de Venezuela."},
              {"year": 1849, "event": "Llega a la Nueva Granada."},
              {"year": 1850, "event": "Comienza a dirigir la Comisión Corográfica."},
              {"year": 1859, "event": "Muere cerca de Valledupar el 7 de febrero."}],
 "questions": [
  q("¿Qué expedición dirigió Codazzi en la Nueva Granada?", ["La Comisión Corográfica", "La Expedición Botánica", "La expedición de Magallanes"], 0, "Su objetivo era describir todo el territorio."),
  q("¿Qué hacía principalmente Codazzi?", ["Mapas", "Esculturas", "Canciones"], 0, "Era cartógrafo."),
  q("¿Qué institución colombiana lleva su nombre?", ["El Instituto Geográfico Agustín Codazzi", "El Banco de la República", "El Museo del Oro"], 0, "Elabora los mapas oficiales del país."),
  q("¿Por qué son valiosas las acuarelas de la Comisión Corográfica?", ["Muestran cómo eran los paisajes y las personas del país en el siglo XIX", "Porque son de oro", "Porque son modernas"], 0, "Son un documento histórico.")]
},
{
 "slug": "manuela-beltran", "name": "Manuela Beltrán",
 "gradeMin": 6, "gradeMax": 11, "reviewNotes": "Se sabe poco de su vida personal; se indica explícitamente.",
 "categories": ["Biografías", "Historia de Colombia", "Mujeres en la historia"],
 "description": "La mujer del Socorro que en 1781 rompió el edicto de los nuevos impuestos y encendió la Revolución de los Comuneros.",
 "body": [
  "De Manuela Beltrán sabemos muy poco: no tenemos su retrato ni conocemos con certeza cuándo nació ni cuándo murió. Pero sabemos lo que hizo un día de mercado, y ese gesto cambió la historia.",
  "Manuela vivía en la villa del Socorro, en la actual Santander, una región de campesinos, tejedores y comerciantes. A finales del siglo dieciocho, el gobierno español aumentó los impuestos sobre productos de consumo diario, como el tabaco, el aguardiente y las telas, y creó nuevos cobros. Para la gente sencilla, que ya vivía con dificultades, aquello era injusto.",
  "El 16 de marzo de 1781, en la plaza del Socorro, se fijó en la pared el edicto que anunciaba los nuevos impuestos. Entonces Manuela Beltrán, ante la multitud reunida en el mercado, arrancó el papel y lo rompió. La gente la apoyó con gritos contra el mal gobierno.",
  "Ese gesto encendió la chispa. En pocas semanas, miles de personas de muchos pueblos se unieron en un gran movimiento que se conoce como la Revolución de los Comuneros. Marcharon hacia Santafé, la capital del virreinato, con el líder Juan Francisco Berbeo al frente. Las autoridades, asustadas, firmaron en junio de 1781 las Capitulaciones de Zipaquirá, en las que prometían rebajar los impuestos y atender muchos reclamos.",
  "El movimiento comunero reunió a personas muy diferentes: campesinos, artesanos, comerciantes, tejedoras, indígenas y algunos criollos acomodados. No todos querían lo mismo. Algunos solo buscaban que bajaran los impuestos; otros reclamaban también la devolución de tierras a los indígenas o mejores condiciones para los más pobres. Las mujeres participaron activamente: llevaban alimentos, difundían noticias y animaban a los marchantes. Se calcula que miles de personas llegaron a acampar cerca de Zipaquirá, a pocas jornadas de la capital, lo que asustó mucho a las autoridades del virreinato. El arzobispo Antonio Caballero y Góngora fue enviado a negociar con ellos.",
  "Sin embargo, poco después el gobierno desconoció esos acuerdos. Uno de los líderes más radicales, José Antonio Galán, que había defendido también a los indígenas y a las personas esclavizadas, fue capturado y ejecutado en 1782.",
  "Aunque los comuneros no lograron lo que buscaban, su levantamiento se considera uno de los antecedentes de la independencia. Y el gesto de Manuela Beltrán quedó en la memoria como símbolo de la valentía de una mujer del pueblo frente a la injusticia.",
  "Su historia también nos recuerda algo importante: muchas mujeres participaron en los grandes momentos de la historia, pero pocos documentos guardaron sus nombres. Por eso vale la pena investigarlas y recordarlas."
 ],
 "funFacts": ["Se sabe muy poco de su vida: lo que la hizo célebre fue un solo gesto, romper un edicto en público.",
              "La Revolución de los Comuneros comenzó en el Socorro, en la actual Santander."],
 "timeline": [{"year": 1781, "event": "El 16 de marzo rompe el edicto de los impuestos en la plaza del Socorro."},
              {"year": 1781, "event": "En junio se firman las Capitulaciones de Zipaquirá."},
              {"year": 1782, "event": "José Antonio Galán es ejecutado."}],
 "questions": [
  q("¿Qué hizo Manuela Beltrán el 16 de marzo de 1781?", ["Rompió el edicto de los nuevos impuestos", "Fundó una ciudad", "Escribió un libro"], 0, "Fue en la plaza del Socorro."),
  q("¿Qué movimiento comenzó con su gesto?", ["La Revolución de los Comuneros", "La Expedición Botánica", "La Comisión Corográfica"], 0, "Miles de personas se unieron."),
  q("¿Qué documento firmaron las autoridades en junio de 1781?", ["Las Capitulaciones de Zipaquirá", "El Acta de Independencia", "La Constitución de 1991"], 0, "Prometían atender los reclamos."),
  q("¿Por qué sabemos tan poco de Manuela Beltrán?", ["Porque pocos documentos guardaron los nombres de las mujeres del pueblo", "Porque vivió en otro país", "Porque prohibieron su nombre"], 0, "Muchas mujeres fueron olvidadas por los documentos.")]
},
{
 "slug": "diego-luis-cordoba", "name": "Diego Luis Córdoba",
 "gradeMin": 8, "gradeMax": 11, "reviewNotes": "Figura política del siglo XX; texto centrado en hechos institucionales.",
 "categories": ["Biografías", "Historia de Colombia", "Afrocolombianidad", "Pacífico colombiano"],
 "description": "El abogado y político chocoano, líder afrocolombiano, que impulsó la creación del departamento del Chocó y defendió la educación de su pueblo.",
 "body": [
  "Diego Luis Córdoba nació el 21 de agosto de 1907 en Neguá, un corregimiento de Quibdó, en el Chocó, a orillas del río Atrato. El Chocó, en el Pacífico colombiano, es una tierra de selvas, ríos y lluvias abundantes, habitada sobre todo por comunidades afrocolombianas e indígenas. Pero en esa época era una de las regiones más olvidadas del país.",
  "Diego Luis estudió en Quibdó y luego viajó al interior para continuar sus estudios. Se graduó como abogado. En la capital, como muchos estudiantes de regiones lejanas, conoció la discriminación por su origen y su color de piel, y eso fortaleció su decisión de luchar por su gente.",
  "Pronto se dedicó a la política. Fue elegido representante a la Cámara y luego senador. Se convirtió en uno de los primeros grandes líderes afrocolombianos en el Congreso de la República, conocido por sus discursos apasionados contra la desigualdad.",
  "Su causa principal fue el Chocó. En aquella época, el Chocó no era un departamento con autonomía, sino una intendencia que dependía directamente del gobierno central. Diego Luis Córdoba promovió en el Congreso la ley que lo convirtió en departamento, lo que se logró en 1947. Así los chocoanos pudieron tener más control sobre sus propios asuntos y recursos.",
  "También defendió con fuerza la educación. Insistía en que los jóvenes chocoanos debían estudiar y prepararse para dirigir su propia región. Impulsó la creación de colegios y apoyó la idea de una institución de educación superior en Quibdó.",
  "Córdoba fue también un gran orador. Sus discursos en el Congreso denunciaban que el Chocó, a pesar de sus riquezas en oro, platino y madera, tenía caminos casi inexistentes, pocas escuelas y hospitales, y altísimos niveles de pobreza. Señalaba que esas riquezas salían de la región sin dejar beneficios a sus habitantes. Defendía con orgullo la cultura afrocolombiana del Pacífico y combatía los prejuicios raciales que existían en el país. Muchos jóvenes chocoanos que luego se convirtieron en maestros, médicos, abogados y líderes se inspiraron en su ejemplo y en su insistencia en la educación. Para él, la educación era el camino más seguro para que el Chocó dejara de ser una región olvidada y pudiera decidir su propio futuro con personas formadas en su propia tierra.",
  "Diego Luis Córdoba murió el 5 de mayo de 1964, en Ciudad de México. Pocos años después, la universidad pública que se creó en Quibdó recibió su nombre: Universidad Tecnológica del Chocó Diego Luis Córdoba.",
  "Su vida es un ejemplo de cómo la educación y la participación política pueden convertirse en herramientas para que las regiones y los pueblos históricamente excluidos reclamen sus derechos."
 ],
 "funFacts": ["La Universidad Tecnológica del Chocó, en Quibdó, lleva su nombre.",
              "Impulsó la ley que convirtió al Chocó en departamento en 1947."],
 "timeline": [{"year": 1907, "event": "Nace en Neguá, Quibdó, el 21 de agosto."},
              {"year": 1947, "event": "El Chocó se convierte en departamento, causa que él impulsó."},
              {"year": 1964, "event": "Muere en Ciudad de México el 5 de mayo."}],
 "questions": [
  q("¿De qué región de Colombia era Diego Luis Córdoba?", ["Del Chocó", "De La Guajira", "Del Amazonas"], 0, "Nació en Neguá, Quibdó."),
  q("¿Qué logró en 1947?", ["Que el Chocó se convirtiera en departamento", "Fundar Bogotá", "Construir un puerto en Cartagena"], 0, "Promovió la ley en el Congreso."),
  q("¿Qué institución lleva su nombre?", ["La Universidad Tecnológica del Chocó", "El Teatro Colón", "El Instituto Codazzi"], 0, "Está en Quibdó."),
  q("¿Qué herramientas defendió para el progreso de su pueblo?", ["La educación y la participación política", "La guerra", "El olvido"], 0, "Insistía en que los jóvenes estudiaran.")]
},
]
