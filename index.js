const salon = {
    nazwa: "Barzytwa Mać",
    godziny: {
      poniedzialek: "09:00-18:00",
      wtorek: "09:00-18:00",
      sroda: "09:00-18:00",
      czwartek: "09:00-20:00",
      piatek: "09:00-20:00",
      sobota: "09:00-14:00",
      niedziela: "zamkniete",
    },
    uslugi: [
      {
        nazwa: "Strzyżenie męskie",
        cena: 60,
        czas: 30,
      },
      {
        nazwa: "Strzyżenie + broda",
        cena: 90,
        czas: 60,
      },
    ],
};

const appointments = [
    {
      date: "dzisiaj",
      time: "09:00",
    },
    {
      date: "dzisiaj",
      time: "10:00",
    },
    {
      date: "jutro",
      time: "12:00",
    },
];

const OpenAI = require("openai");

const client = new OpenAI();

function checkAvailability(date, time) {
    console.log(`Sprawdzam dostępność: ${date} o ${time}`);
  
    const isBusy = appointments.some(
      (appointment) =>
        appointment.date === date &&
        appointment.time === time
    );
  
    return {
      available: !isBusy,
      date: date,
      time: time,
    };
}

async function main() {
  const response = await client.responses.create({
    model: "gpt-5.6",
    input: `Jesteś recepcjonistką salonu fryzjerskiego.

            Nazwa salonu: ${salon.nazwa}

            Godziny otwarcia:
            ${JSON.stringify(salon.godziny, null, 2)}

            Usługi:
            ${JSON.stringify(salon.uslugi, null, 2)}

            Rozmawiaj naturalnie i po polsku.
            Odpowiadaj klientom na pytania dotyczące salonu.
            Nie wymyślaj informacji, których nie masz.

            Klient pyta: "Czy mogę umówić się dzisiaj na 09:30 na strzyżenie?"

            Jeżeli sprawdzenie dostępności zwróci, że termin jest dostępny,
            poinformuj klienta, że termin jest wolny.
            Jeżeli termin jest niedostępny, poinformuj klienta, że jest zajęty.`,
    tools: [
        {
            type: "function",
            name: "checkAvailability",
            description: "Sprawdza, czy w podanym terminie jest dostępna wizyta.",
            parameters: {
                type: "object",
                properties: {
                    date: {
                        type: "string",
                        description: "Data wizyty, np. jutro"
                    },
                    time: {
                        type: "string",
                        description: "Godzina wizyty, np. 17:00"
                    }
                },
                required: ["date", "time"],
                additionalProperties: false
            },
            strict: true
        }
    ],
    tool_choice: "required",
  });

  const toolCall = response.output.find(
    (item) => item.type === "function_call"
  );
  
  const args = JSON.parse(toolCall.arguments);
  
  const result = checkAvailability(
    args.date,
    args.time
  );
  
  const finalResponse = await client.responses.create({
    model: "gpt-5.6",
  
    previous_response_id: response.id,
  
    input: [
      {
        type: "function_call_output",
        call_id: toolCall.call_id,
        output: JSON.stringify(result)
      }
    ]
  });
  
  console.log(finalResponse.output_text);
}

main();