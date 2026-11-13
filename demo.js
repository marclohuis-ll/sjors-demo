// Controle van de afspraakaanvraag. Draait in de browser én opnieuw op de server.

                                                                                                     
                                                             

const velden = ['soort', 'naam', 'email', 'tel', 'voorkeur']         ;

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
  const gekozen = new URLSearchParams(location.search).get('soort');
  if (gekozen === 'eerste' || gekozen === 'vervolg') {
    form.querySelector(`[data-soort="${gekozen}"]`).checked = true;
  }

  const foutElement = (naam) => document.getElementById(`demo-fout-${naam}`);
  const invoer = (naam) => naam === 'soort'
    ? form.querySelector('[data-soort]')
    : document.getElementById(`afs-${naam}`);

  function toonFout(naam, melding) {
    foutElement(naam).textContent = melding ?? '';
    foutElement(naam).hidden = !melding;
    invoer(naam).setAttribute('aria-invalid', String(Boolean(melding)));
  }

  form.addEventListener('input', (event) => {
    const naam = event.target.dataset.soort ? 'soort' : event.target.id.slice(4);
    if (velden.includes(naam)) toonFout(naam);
  });

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
    velden.forEach((naam) => toonFout(naam, fouten[naam]));
    const eersteFout = velden.find((naam) => fouten[naam]);
    if (eersteFout) {
      invoer(eersteFout).focus();
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

  form.querySelector('button[type=submit]').disabled = false;
}
