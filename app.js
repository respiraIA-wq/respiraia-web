// ============================================================
// CONFIGURACIÓN
// ============================================================

// PEGA AQUÍ LA URL REAL DE TU GOOGLE APPS SCRIPT

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyQrdWmUwxnO9QyTqEFwu-9-qOFVbR0Ia_aVFTK4ayz_V275CelPAPP1ZYcWfnC0K8f/exec";


// ============================================================
// ELEMENTOS HTML
// ============================================================

const recordButton =
  document.getElementById(
    "recordButton"
  );


const analyzeButton =
  document.getElementById(
    "analyzeButton"
  );


const status =
  document.getElementById(
    "status"
  );


const timer =
  document.getElementById(
    "timer"
  );


const resultBox =
  document.getElementById(
    "resultBox"
  );


// ============================================================
// VARIABLES
// ============================================================

let mediaRecorder = null;

let audioChunks = [];

let audioBlob = null;

let audioBase64 = "";

let audioMimeType =
  "audio/webm";

let countdownInterval = null;


// ============================================================
// DURACIÓN
// ============================================================

const RECORDING_SECONDS = 5;


// ============================================================
// COMPROBAR URL
// ============================================================

function comprobarConfiguracion() {

  if (
    !APPS_SCRIPT_URL ||
    APPS_SCRIPT_URL ===
      "PON_AQUI_LA_URL_DE_TU_APPS_SCRIPT"
  ) {

    throw new Error(
      "No has configurado APPS_SCRIPT_URL."
    );

  }

}


// ============================================================
// GRABAR
// ============================================================

recordButton.addEventListener(
  "click",
  iniciarGrabacion
);


async function iniciarGrabacion() {

  try {

    comprobarConfiguracion();


    // Desactivar botones
    recordButton.disabled = true;

    analyzeButton.disabled = true;


    // Limpiar resultado anterior
    resultBox.textContent =
      "Esperando análisis...";


    status.textContent =
      "Solicitando acceso al micrófono...";


    timer.textContent =
      "0 s";


    // ========================================================
    // PEDIR MICRÓFONO
    // ========================================================

    const stream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });


    // ========================================================
    // COMPROBAR FORMATO
    // ========================================================

    let mimeType =
      "audio/webm";


    if (
      MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
    ) {

      mimeType =
        "audio/webm;codecs=opus";

    }

    else if (
      MediaRecorder.isTypeSupported(
        "audio/webm"
      )
    ) {

      mimeType =
        "audio/webm";

    }


    audioMimeType =
      mimeType;


    // ========================================================
    // CREAR GRABADOR
    // ========================================================

    audioChunks = [];


    mediaRecorder =
      new MediaRecorder(
        stream,
        {
          mimeType:
            mimeType
        }
      );


    // ========================================================
    // CUANDO LLEGAN DATOS
    // ========================================================

    mediaRecorder.ondataavailable =
      function(event) {

        if (
          event.data &&
          event.data.size > 0
        ) {

          audioChunks.push(
            event.data
          );

        }

      };


    // ========================================================
    // CUANDO TERMINA
    // ========================================================

    mediaRecorder.onstop =
      async function() {

        try {

          // Crear Blob
          audioBlob =
            new Blob(
              audioChunks,
              {
                type:
                  audioMimeType
              }
            );


          // Apagar micrófono
          stream
            .getTracks()
            .forEach(
              track =>
                track.stop()
            );


          status.textContent =
            "Grabación terminada. Preparando audio...";


          // Convertir a Base64
          audioBase64 =
            await blobToBase64(
              audioBlob
            );


          status.textContent =
            "Audio preparado. Pulsa ANALIZAR.";


          analyzeButton.disabled =
            false;


          recordButton.disabled =
            false;


        } catch (error) {

          console.error(
            error
          );


          status.textContent =
            "Error preparando el audio: " +
            error.message;


          recordButton.disabled =
            false;

        }

      };


    // ========================================================
    // INICIAR GRABACIÓN
    // ========================================================

    mediaRecorder.start();


    status.textContent =
      "Grabando...";


    let seconds =
      0;


    timer.textContent =
      "0 s";


    countdownInterval =
      setInterval(
        function() {

          seconds++;


          timer.textContent =
            seconds + " s";


          if (
            seconds >=
            RECORDING_SECONDS
          ) {

            clearInterval(
              countdownInterval
            );


            if (
              mediaRecorder &&
              mediaRecorder.state ===
                "recording"
            ) {

              mediaRecorder.stop();

            }

          }

        },
        1000
      );


  } catch (error) {

    console.error(
      "ERROR DEL MICROFONO:",
      error
    );


    let mensaje =
      "No se pudo acceder al micrófono.";


    if (
      error.name ===
      "NotAllowedError"
    ) {

      mensaje =
        "El navegador ha bloqueado el micrófono. " +
        "Comprueba el permiso del sitio.";

    }

    else if (
      error.name ===
      "NotFoundError"
    ) {

      mensaje =
        "No se encontró ningún micrófono.";

    }

    else if (
      error.name ===
      "NotReadableError"
    ) {

      mensaje =
        "El micrófono existe, pero no se puede utilizar. " +
        "Puede estar siendo utilizado por otra aplicación.";

    }

    else {

      mensaje =
        "Error del micrófono: " +
        error.name +
        " - " +
        error.message;

    }


    status.textContent =
      mensaje;


    recordButton.disabled =
      false;

  }

}


// ============================================================
// BLOB → BASE64
// ============================================================

function blobToBase64(blob) {

  return new Promise(
    function(resolve, reject) {

      const reader =
        new FileReader();


      reader.onloadend =
        function() {

          const result =
            reader.result;


          const base64 =
            result.split(",")[1];


          resolve(base64);

        };


      reader.onerror =
        function(error) {

          reject(error);

        };


      reader.readAsDataURL(
        blob
      );

    }
  );

}


// ============================================================
// ANALIZAR
// ============================================================

analyzeButton.addEventListener(
  "click",
  analizar
);


async function analizar() {

  try {

    comprobarConfiguracion();


    if (!audioBase64) {

      status.textContent =
        "Primero debes grabar un audio.";

      return;

    }


    recordButton.disabled =
      true;

    analyzeButton.disabled =
      true;


    resultBox.textContent =
      "Analizando el audio con Gemini...";


    status.textContent =
      "Enviando audio a RespiraIA...";


    // ========================================================
    // CREAR ID ÚNICO
    // ========================================================

    const requestId =
      crearRequestId();


    // ========================================================
    // ENVIAR AUDIO
    // ========================================================

    enviarAudio(
      requestId,
      audioBase64,
      audioMimeType
    );


    status.textContent =
      "Audio enviado. Gemini está analizando...";


    // ========================================================
    // ESPERAR RESULTADO
    // ========================================================

    esperarResultado(
      requestId
    );


  } catch (error) {

    console.error(
      error
    );


    status.textContent =
      "Error: " +
      error.message;


    recordButton.disabled =
      false;

    analyzeButton.disabled =
      false;

  }

}


// ============================================================
// CREAR ID
// ============================================================

function crearRequestId() {

  const timestamp =
    Date.now();


  const random =
    Math.random()
      .toString(36)
      .substring(2, 12);


  return (
    "REQ-" +
    timestamp +
    "-" +
    random
  );

}


// ============================================================
// ENVIAR AUDIO MEDIANTE FORMULARIO
// ============================================================
//
// Utilizamos un formulario HTML porque no dependemos de
// fetch/CORS para enviar el POST a Apps Script.
// ============================================================

function enviarAudio(
  requestId,
  audio,
  mimeType
) {

  const iframe =
    document.createElement(
      "iframe"
    );


  iframe.name =
    "respiraiaUploadFrame";


  iframe.style.display =
    "none";


  document.body.appendChild(
    iframe
  );


  const form =
    document.createElement(
      "form"
    );


  form.method =
    "POST";


  form.action =
    APPS_SCRIPT_URL;


  form.target =
    "respiraiaUploadFrame";


  form.style.display =
    "none";


  // ID
  const requestInput =
    document.createElement(
      "input"
    );


  requestInput.type =
    "hidden";


  requestInput.name =
    "requestId";


  requestInput.value =
    requestId;


  form.appendChild(
    requestInput
  );


  // AUDIO BASE64
  const audioInput =
    document.createElement(
      "input"
    );


  audioInput.type =
    "hidden";


  audioInput.name =
    "audioBase64";


  audioInput.value =
    audio;


  form.appendChild(
    audioInput
  );


  // MIME TYPE
  const mimeInput =
    document.createElement(
      "input"
    );


  mimeInput.type =
    "hidden";


  mimeInput.name =
    "mimeType";


  mimeInput.value =
    mimeType;


  form.appendChild(
    mimeInput
  );


  document.body.appendChild(
    form
  );


  form.submit();


  // Limpiar posteriormente
  setTimeout(
    function() {

      form.remove();

      iframe.remove();

    },
    60000
  );

}


// ============================================================
// CONSULTAR RESULTADO
// ============================================================

function esperarResultado(
  requestId
) {

  let intentos =
    0;


  const maxIntentos =
    60;


  const intervalo =
    2000;


  const intervaloId =
    setInterval(
      function() {

        intentos++;


        consultarResultado(
          requestId,
          function(data) {

            console.log(
              "Respuesta:",
              data
            );


            // ================================================
            // TERMINADO
            // ================================================

            if (
              data.status ===
              "done"
            ) {

              clearInterval(
                intervaloId
              );


              resultBox.textContent =
                data.resultado;


              status.textContent =
                "Análisis completado.";


              recordButton.disabled =
                false;


              analyzeButton.disabled =
                true;


              return;

            }


            // ================================================
            // ERROR
            // ================================================

            if (
              data.status ===
              "error"
            ) {

              clearInterval(
                intervaloId
              );


              resultBox.textContent =
                "Error durante el análisis:\n\n" +
                data.message;


              status.textContent =
                "El análisis ha fallado.";


              recordButton.disabled =
                false;


              analyzeButton.disabled =
                false;


              return;

            }


            // ================================================
            // PROCESANDO
            // ================================================

            if (
              data.status ===
              "processing"
            ) {

              status.textContent =
                "Gemini está analizando el audio...";

            }


          }
        );


        if (
          intentos >=
          maxIntentos
        ) {

          clearInterval(
            intervaloId
          );


          status.textContent =
            "El análisis está tardando demasiado. " +
            "Comprueba Google Sheets.";


          recordButton.disabled =
            false;


          analyzeButton.disabled =
            false;

        }

      },
      intervalo
    );

}


// ============================================================
// JSONP
// ============================================================

function consultarResultado(
  requestId,
  callback
) {

  const callbackName =
    "respiraIA_" +
    Date.now() +
    "_" +
    Math.floor(
      Math.random() * 100000
    );


  window[callbackName] =
    function(data) {

      try {

        callback(data);

      } finally {

        delete window[
          callbackName
        ];

        if (
          script &&
          script.parentNode
        ) {

          script.parentNode.removeChild(
            script
          );

        }

      }

    };


  const script =
    document.createElement(
      "script"
    );


  const url =
    APPS_SCRIPT_URL +
    "?requestId=" +
    encodeURIComponent(
      requestId
    ) +
    "&callback=" +
    encodeURIComponent(
      callbackName
    ) +
    "&t=" +
    Date.now();


  script.src =
    url;


  script.onerror =
    function() {

      console.error(
        "No se pudo consultar Apps Script."
      );

      delete window[
        callbackName
      ];

      if (
        script.parentNode
      ) {

        script.parentNode.removeChild(
          script
        );

      }

    };


  document.body.appendChild(
    script
  );

}
