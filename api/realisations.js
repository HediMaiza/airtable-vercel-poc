// api/realisations.js

export default async function handler(req, res) {
  // CORS - autoriser tous les domaines
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME; // ex: "Realisations"
  const token = process.env.AIRTABLE_TOKEN;

  if (!baseId || !tableName || !token) {
    return res.status(500).json({ error: 'Config serveur manquante' });
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    tableName
  )}?maxRecords=100&sort[0][field]=Titre&sort[0][direction]=asc`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      return res
        .status(response.status)
        .json({ error: 'Erreur Airtable', details: text });
    }

    const data = await response.json();

    // On mappe les données pour n’exposer que ce qui t’intéresse
    const projets = (data.records || []).map((record) => {
      // Extraire l'URL de la première image du champ Attachment "Images"
      let imageUrl = '';
      if (record.fields.Images && Array.isArray(record.fields.Images) && record.fields.Images.length > 0) {
        imageUrl = record.fields.Images[0].url || '';
      }
    
      return {
        id: record.id,
        titre: record.fields.Titre || '',
        description: record.fields.Description || '',
        imageUrl: imageUrl
      };
    });

    return res.status(200).json(projets);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur', details: String(err) });
  }
}
