// Controle van de afspraakaanvraag. Draait in de browser én opnieuw op de server.

                                                                                                     
                                                             

const velden = ['soort', 'naam', 'email', 'tel', 'voorkeur']         ;
const aanvraagStappen                                           = [
  ['soort'],
  [],
  ['naam', 'email', 'tel'],
  ['voorkeur'],
];

const meldingen                                 = {
  soort: 'Kies eerst een soort afspraak.',
  naam: 'Vul je voor- en achternaam in.',
  email: 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.',
  tel: 'Vul een telefoonnummer van 10 cijfers in, bijvoorbeeld 06 12345678.',
  voorkeur: 'Vul in wanneer het je goed uitkomt.',
};

                                                                     
const soortNaam = (soort        , s       ) =>
  soort === 'vervolg' ? `Vervolgafspraak, ${s.vervolg.duur} minuten` : `Eerste afspraak, ${s.eerste.duur} minuten`;

// Bovengrenzen gelijk aan de controles in de database.
const max = { naam: 200, email: 320, tel: 40, voorkeur: 1000 };

function controleer(a          )         {
  const f         = {};
  const naam = a.naam.trim(), email = a.email.trim(), tel = a.tel.trim(), voorkeur = a.voorkeur.trim();
  if (a.soort !== 'eerste' && a.soort !== 'vervolg') f.soort = meldingen.soort;
  if (naam.length < 2 || naam.length > max.naam) f.naam = meldingen.naam;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > max.email) f.email = meldingen.email;
  if (tel.replace(/\D/g, '').length < 10 || tel.length > max.tel) f.tel = meldingen.tel;
  if (voorkeur.length < 2 || voorkeur.length > max.voorkeur) f.voorkeur = meldingen.voorkeur;
  return f;
}

const menu = document.querySelector('details.inhoud');
menu?.addEventListener('click', (event) => {
  if (event.target.closest('a')) menu.open = false;
});
menu?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});

const form = document.querySelector('#demo-aanvraag');
if (form) {
  let stap = 0;
  const gekozen = new URLSearchParams(location.search).get('soort');
  if (gekozen === 'eerste' || gekozen === 'vervolg') {
    form.querySelector(`[data-soort="${gekozen}"]`).checked = true;
  }

  const foutElement = (naam) => document.getElementById(`demo-fout-${naam}`);
  const invoer = (naam) => naam === 'soort'
    ? form.querySelector('[data-soort]')
    : document.getElementById(`afs-${naam}`);

  function gaNaar(nummer) {
    stap = nummer;
    form.querySelectorAll('[data-aanvraag-stap]').forEach((paneel) => paneel.hidden = Number(paneel.dataset.aanvraagStap) !== stap);
    form.querySelectorAll('.inlog-stappen li').forEach((item, index) => {
      if (index === stap) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    document.getElementById(`aanvraag-kop-${stap}`).focus();
  }

  function toonFout(naam, melding) {
    foutElement(naam).textContent = melding ?? '';
    foutElement(naam).hidden = !melding;
    invoer(naam).setAttribute('aria-invalid', String(Boolean(melding)));
  }

  form.addEventListener('input', (event) => {
    const naam = event.target.dataset.soort ? 'soort' : event.target.id.slice(4);
    if (velden.includes(naam)) toonFout(naam);
  });

  for (const terug of form.querySelectorAll('[data-aanvraag-terug]')) {
    terug.addEventListener('click', () => gaNaar(Number(terug.dataset.aanvraagTerug)));
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const aanvraag = {
      soort: form.querySelector('[data-soort]:checked')?.dataset.soort ?? '',
      naam: invoer('naam').value,
      email: invoer('email').value,
      tel: invoer('tel').value,
      voorkeur: invoer('voorkeur').value,
    };
    const fouten = controleer(aanvraag);
    const controle = stap === aanvraagStappen.length - 1 ? velden : aanvraagStappen[stap];
    controle.forEach((naam) => toonFout(naam, fouten[naam]));
    const eersteFout = controle.find((naam) => fouten[naam]);
    if (eersteFout) {
      const foutStap = aanvraagStappen.findIndex((stapVelden) => stapVelden.includes(eersteFout));
      if (stap !== foutStap) gaNaar(foutStap);
      invoer(eersteFout).focus();
      return;
    }

    if (stap === 0) {
      form.querySelector('[data-account-route]').href = './portaal.html?doel=boeken&soort=' + aanvraag.soort;
    }
    if (stap < aanvraagStappen.length - 1) {
      gaNaar(stap + 1);
      return;
    }

    const bevestiging = document.getElementById('demo-bevestiging');
    bevestiging.querySelector('[data-type]').textContent =
      aanvraag.soort === 'eerste' ? 'Eerste afspraak' : 'Vervolgafspraak';
    bevestiging.querySelector('[data-voorkeur]').textContent = aanvraag.voorkeur.trim();
    form.reset();
    form.hidden = true;
    document.getElementById('demo-formulierkop').hidden = true;
    bevestiging.hidden = false;
    bevestiging.querySelector('h1').focus();
  });

  form.querySelectorAll('button[type=submit]').forEach((knop) => knop.disabled = false);
}

{
  const portaal = document.querySelector('#demo-portaal');
  if (portaal) {
    const parameters = new URLSearchParams(location.search);
    const praktijk = parameters.get('rol') === 'praktijk';
    const voorbeeldcode = '123456';
    const opslag = 'sjors-demo-afspraken-v2';
    const $ = (selector) => portaal.querySelector(selector);
    const emailForm = $('#portaal-email-stap');
    const codeForm = $('#portaal-code-stap');
    const code = $('#portaal-code');
    const uitleg = $('#portaal-uitleg');
    const fout = $('#portaal-fout');
    const titel = praktijk ? 'Inloggen voor de praktijk' : 'Inloggen voor patiënten';
    const begTekst = 'Probeer het portaal met het voorbeeldadres hieronder.';
    const tijden = ['09:00', '10:30', '14:00', '15:30'];
    const vandaag = new Date();
    vandaag.setHours(12, 0, 0, 0);
    const datumTekst = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
    const datumKort = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' });
    const dagKort = new Intl.DateTimeFormat('nl-NL', { weekday: 'short' });
    let week = 0;
    let dag = -1;
    let gekozenTijd = '';
    let aanvragen = [];
    try { aanvragen = JSON.parse(sessionStorage.getItem(opslag) ?? '[]'); } catch { /* Begin met een lege demo. */ }

    function datum(afstand) {
      const resultaat = new Date(vandaag);
      resultaat.setDate(resultaat.getDate() + afstand);
      return resultaat;
    }

    const dagSleutel = (afstand) => {
      const waarde = datum(afstand);
      return [waarde.getFullYear(), waarde.getMonth() + 1, waarde.getDate()].join('-');
    };

    function scherm(naam) {
      for (const deel of portaal.querySelectorAll('[data-scherm]')) deel.hidden = deel.dataset.scherm !== naam;
      $(`[data-scherm="${naam}"] h1`).focus();
    }

    function stap(element, nummer) {
      element.querySelectorAll('.inlog-stappen li').forEach((item, index) => {
        if (index + 1 === nummer) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
    }

    function inlogStap(codeTonen) {
      emailForm.hidden = codeTonen;
      codeForm.hidden = !codeTonen;
      stap($('[data-scherm="inlog"]'), codeTonen ? 2 : 1);
      uitleg.textContent = codeTonen ? `Gebruik de voorbeeldcode ${voorbeeldcode}.` : begTekst;
      fout.hidden = true;
      code.value = '';
      code.removeAttribute('aria-invalid');
      if (codeTonen) code.focus();
    }

    function bewaar() {
      try { sessionStorage.setItem(opslag, JSON.stringify(aanvragen)); } catch { /* De huidige pagina blijft bruikbaar. */ }
    }

    function groep(titel, afspraken, leeg) {
      const sectie = document.createElement('section');
      sectie.className = 'app-blok';
      sectie.setAttribute('aria-label', titel);
      const kop = document.createElement('h2');
      kop.textContent = titel;
      sectie.append(kop);
      if (!afspraken.length) {
        const tekst = document.createElement('p');
        tekst.textContent = leeg;
        sectie.append(tekst);
        return sectie;
      }
      for (const afspraak of afspraken) {
        const kaart = document.createElement('article');
        kaart.className = 'kaart afspraak-kaart';
        const status = document.createElement('span');
        status.className = `chip ${afspraak.status}`;
        status.textContent = afspraak.status === 'aangevraagd' ? 'Wacht op bevestiging' : 'Bevestigd';
        const moment = document.createElement('h3');
        moment.textContent = afspraak.moment;
        const type = document.createElement('p');
        type.textContent = praktijk ? `Anna de Vries · ${afspraak.soort}` : afspraak.soort;
        kaart.append(status, moment, type);
        if (praktijk && afspraak.status === 'aangevraagd') {
          const knop = document.createElement('button');
          knop.type = 'button';
          knop.className = 'knop app-knop';
          knop.textContent = 'Bevestig afspraak';
          knop.addEventListener('click', () => {
            afspraak.status = 'bevestigd';
            if (!aanvragen.includes(afspraak)) aanvragen.push(afspraak);
            bewaar();
            afsprakenScherm();
          });
          kaart.append(knop);
        }
        sectie.append(kaart);
      }
      return sectie;
    }

    function afsprakenScherm() {
      const moment = (offset, tijd) => `${datumTekst.format(datum(offset))} om ${tijd} uur`;
      const gepland = { moment: moment(3, '11:00'), soort: 'Vervolgafspraak', status: 'bevestigd' };
      const eerder = { moment: moment(-12, '10:00'), soort: 'Eerste afspraak', status: 'bevestigd' };
      const voorbeeld = { moment: moment(2, '11:30'), soort: 'Eerste afspraak', status: 'aangevraagd' };
      const wachtend = aanvragen.filter((a) => a.status === 'aangevraagd');
      const bevestigd = aanvragen.filter((a) => a.status === 'bevestigd');
      $('#portaal-afspraken').textContent = praktijk ? 'Praktijkagenda van Sjors' : 'Mijn afspraken';
      $('#portaal-afspraken-uitleg').textContent = praktijk
        ? 'Bekijk je planning en bevestig de voorbeeldaanvragen.'
        : 'Bekijk je komende en eerdere afspraken of kies een nieuw moment.';
      $('[data-actie="plannen"]').hidden = praktijk;
      $('#portaal-lijsten').replaceChildren(
        praktijk ? groep('Te bevestigen', wachtend.length || bevestigd.length ? wachtend : [voorbeeld], 'Er wachten geen aanvragen op bevestiging.') : '',
        groep(praktijk ? 'Gepland' : 'Komende afspraken', praktijk ? [...bevestigd, gepland] : [...aanvragen, gepland], ''),
        groep('Geschiedenis', [eerder], ''),
      );
      scherm('afspraken');
    }

    function planner(nummer) {
      const deel = $('[data-scherm="planner"]');
      deel.querySelectorAll('[data-plan]').forEach((paneel) => paneel.hidden = Number(paneel.dataset.plan) !== nummer);
      stap(deel, nummer);
      scherm('planner');
    }

    function kalender() {
      const begin = 1 + week * 7;
      $('#portaal-week').textContent = `${datumKort.format(datum(begin))} – ${datumKort.format(datum(begin + 6))}`;
      $('[data-actie="vorige-week"]').disabled = week === 0;
      $('[data-actie="volgende-week"]').disabled = week === 3;
      $('#portaal-dagen').replaceChildren(...Array.from({ length: 7 }, (_, index) => {
        const afstand = begin + index;
        const waarde = datum(afstand);
        const knop = document.createElement('button');
        knop.type = 'button';
        knop.disabled = waarde.getDay() === 0 || waarde.getDay() === 6;
        knop.setAttribute('aria-label', datumTekst.format(waarde));
        knop.setAttribute('aria-pressed', String(afstand === dag));
        knop.textContent = `${dagKort.format(waarde)} ${waarde.getDate()}`;
        knop.addEventListener('click', () => {
          dag = afstand;
          gekozenTijd = '';
          kalender();
          $('#portaal-tijden button')?.focus();
        });
        return knop;
      }));
      $('#portaal-tijden').replaceChildren(...(dag < 0 ? [] : tijden.map((tijd) => {
        const knop = document.createElement('button');
        knop.type = 'button';
        knop.className = 'knop-lijn app-knop';
        knop.textContent = tijd;
        knop.disabled = aanvragen.some((a) => a.dag === dagSleutel(dag) && a.tijd === tijd);
        knop.setAttribute('aria-pressed', String(tijd === gekozenTijd));
        knop.addEventListener('click', () => {
          gekozenTijd = tijd;
          for (const tijdknop of $('#portaal-tijden').children) {
            tijdknop.setAttribute('aria-pressed', String(tijdknop === knop));
          }
          $('[data-actie="overzicht"]').disabled = false;
        });
        return knop;
      })));
      $('[data-actie="overzicht"]').disabled = !gekozenTijd;
    }

    $('#portaal-kop').textContent = titel;
    if (parameters.get('soort') === 'eerste') $('input[name="demo-type"][value="Eerste afspraak"]').checked = true;
    $('#portaal-email').value = praktijk ? 'sjors@voorbeeld.test' : 'anna@voorbeeld.test';
    $(`[data-rol="${praktijk ? 'praktijk' : 'patient'}"]`).setAttribute('aria-current', 'page');
    inlogStap(false);
    emailForm.addEventListener('submit', (event) => { event.preventDefault(); inlogStap(true); });
    emailForm.querySelector('button').disabled = false;
    codeForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (code.value.trim() !== voorbeeldcode) {
        fout.textContent = `Gebruik de voorbeeldcode ${voorbeeldcode}.`;
        fout.hidden = false;
        code.setAttribute('aria-invalid', 'true');
        code.focus();
        return;
      }
      code.value = '';
      if (!praktijk && parameters.get('doel') === 'boeken') planner(1);
      else afsprakenScherm();
    });

    const acties = {
      'terug-inlog': () => { inlogStap(false); emailForm.querySelector('button').focus(); },
      uitloggen: () => { inlogStap(false); scherm('inlog'); },
      afspraken: afsprakenScherm,
      plannen: () => planner(1),
      moment: () => { kalender(); planner(2); },
      'vorige-week': () => verschuifWeek(-1),
      'volgende-week': () => verschuifWeek(1),
      overzicht: () => {
        $('#portaal-soort').textContent = $('input[name="demo-type"]:checked').value;
        $('#portaal-moment').textContent = `${datumTekst.format(datum(dag))} om ${gekozenTijd} uur`;
        planner(3);
      },
      aanvragen: () => {
        aanvragen.push({ dag: dagSleutel(dag), tijd: gekozenTijd, soort: $('#portaal-soort').textContent, moment: $('#portaal-moment').textContent, status: 'aangevraagd' });
        bewaar();
        dag = -1;
        gekozenTijd = '';
        afsprakenScherm();
      },
    };
    function verschuifWeek(richting) {
      week += richting;
      dag = -1;
      gekozenTijd = '';
      kalender();
    }
    portaal.addEventListener('click', (event) => {
      const knop = event.target.closest('button[data-actie]');
      if (knop && !knop.disabled) acties[knop.dataset.actie]();
    });
  }
}
