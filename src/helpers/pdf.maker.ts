import { Injectable, Logger } from '@nestjs/common';
const  PdfPrinter = require('pdfmake');
import { Bulletin } from 'src/bulletin/entities/bulletin.entity';
import { Lot } from 'src/lot/entities/lot.entity';
import { Calcul } from './calcul';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { flatten, round } from 'lodash';
import { StorageService } from 'src/storage/storage.service';

const fonts = {
  TmesNewRoman: {
    normal: 'src/helpers/font/TimesNewRoman/timesnewroman.ttf',
    bold: 'src/helpers/font/TimesNewRoman/timesnewromanbold.ttf',
    italics: 'src/helpers/font/TimesNewRoman/timesnewromanitalic.ttf',
    bolditalics: 'src/helpers/TimesNewRoman/timesnewromanbolditalic.ttf',
  },
  Roboto: {
    normal: 'src/helpers/font/roboto-font/Roboto-Regular.ttf',
    bold: 'src/helpers/font/roboto-font/Roboto-Medium.ttf',
    italics: 'src/helpers/font/roboto-font/Roboto-Italic.ttf',
    bolditalics: 'src/helpers/font/font/Roboto-MediumItalic.ttf',
  },
};

 PdfPrinter.addFonts(fonts);

PdfPrinter.setLocalAccessPolicy((path: string) => path.startsWith('src/helpers/'));
PdfPrinter.setUrlAccessPolicy(() => false);

const formatNumber = (n: number) =>
  String(n).replace(/(.)(?=(\d{3})+$)/g, '$1 ');

@Injectable()
export class PdfMaker {
  private readonly logger = new Logger(PdfMaker.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Upload un PDF vers S3 et retourne la clé (chemin relatif)
   */
  private async uploadPdf(pdfDoc: any, key: string): Promise<string> {
    if (this.storageService.isEnabled()) {
      const buffer = await pdfDoc.getBuffer();
      const uploaded = await this.storageService.upload(key, buffer, 'application/pdf');
      this.logger.log(`Bulletin uploadé: ${key}`);
      return uploaded.key;
    } else {
      // Fallback vers stockage local
      const { createWriteStream, mkdirSync } = await import('fs');
      const { dirname } = await import('path');
      const filePath = `uploads/${key}`;
      mkdirSync(dirname(filePath), { recursive: true });
      const stream = await pdfDoc.getStream();
      stream.pipe(createWriteStream(filePath));
      return filePath;
    }
  }

  async make(bulletin: Bulletin, olds: Bulletin[], lot: Lot, contrat?: any, couleur = '#fac66b') {
    const { mois, annee, debut, fin, etat, _id: idlot } = lot;
    const employe = bulletin['employe'] as any;
    const cal = new Calcul();
    const debutStr = format(
      parse(debut, 'yyyy-MM-dd', new Date()),
      'dd MMMM yyyy',
      { locale: fr },
    );
    const finStr = format(
      parse(fin, 'yyyy-MM-dd', new Date()),
      'dd MMMM yyyy',
      { locale: fr },
    );
    const anneeStr = format(parse(debut, 'yyyy-MM-dd', new Date()), 'MMMM', {
      locale: fr,
    }).toUpperCase();
    const wm = etat === 'VALIDE' ? annee : 'BROUILLON';
    const totauxAnnuels = cal.getTotauxAnnuel([...olds, bulletin]);
    const docDefinition = {
      footer: function () {
        return {
          text: 'DANS VOTRE INTERET ET POUR VOUS AIDER A FAIRE VALOIR VOS DROITS, CONSERVER CE BULLETIN DE PAIE SANS LIMITATION DE DUREE',
          fontSize: 6,
          alignment: 'center',
          italics: true,
        };
      },
      watermark: {
        text: `Bulletin CROUS/Z ${wm}`,
        color: etat === 'VALIDE' ? 'grey' : 'red',
        opacity: 0.1,
        bold: true,
        italics: false,
      },
      content: [
        {
          columns: [
            {
              with: '20%',
              alignment: 'left',
              stack: [
                {
                  text: 'REPUBLIQUE DU SENEGAL\n',
                  fontSize: 6,
                  bold: true,
                  alignment: 'center',
                },
                {
                  text: 'Un Peuple, Un but, Une Foi\n',
                  fontSize: 6,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  image: 'src/helpers/drapeau.jpg',
                  width: 40,
                  alignment: 'center',
                },
                {
                  text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                  fontSize: 6,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                  fontSize: 6,
                  bold: true,
                  alignment: 'center',
                },
                {
                  text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                  fontSize: 6,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  text: 'SOCIALES DE ZIGUINCHOR',
                  fontSize: 6,
                  bold: true,
                  alignment: 'center',
                },
              ],
            },

            {
              qr: `${lot._id}:${bulletin.employe}`,
              fit: 80,
              alignment: 'center',
              eccLevel: 'M',
            },

            {
              with: '20%',
              alignment: 'right',
              stack: [
                {
                  image: 'src/helpers/logo.png',
                  width: 80,
                  margin: [10, 2],
                },
                {
                  text: `Du ${debutStr} Au ${finStr}`,
                  fontSize: 6,
                  bold: true,
                },
              ],
            },
          ],
        },
        {
          margin: [6, 15],
          fillColor: couleur,
          alignment: 'center',
          layout: 'noBorders',
          table: {
            widths: [500],
            body: [
              [
                {
                  text: 'BULLETIN DE PAIE',
                  fontSize: 16,
                  bold: true,
                  margin: [0, 2],
                },
              ],
            ],
          },
        },
        {
          columns: [
            {
              with: 'auto',
              alignment: 'right',
              fontSize: 6,
              italics: true,
              text: `BULLETINS DU MOIS DE ${anneeStr}\n`,
            },
          ],
        },
        {
          columns: [
            {
              alignment: 'left',
              margin: [10, 0],
              layout: 'noBorders',
              table: {
                body: [
                  [
                    { text: 'Prenom et Nom :', style: 'info' },
                    { text: `${employe.prenom} ${employe.nom}`, fontSize: 6 },
                  ],
                  [
                    { text: 'Matricule de Solde :', style: 'info' },
                    { text: `${contrat?.matricule_de_solde || 'N/A'}`, fontSize: 6 },
                  ],
                  [
                    { text: 'Emploi :', style: 'info' },
                    { text: `${contrat?.poste?.nom || 'N/A'}`, fontSize: 6 },
                  ],
                  [
                    { text: 'Nombre de parts :', style: 'info' },
                    { text: `${contrat?.nombre_de_parts || 'N/A'}`, fontSize: 6 },
                  ],
                  [
                    { text: 'Contrat :', style: 'info' },
                    { text: `${contrat?.type || 'N/A'}`, fontSize: 6 },
                  ],
                ],
              },
            },
            {
              alignment: 'left',
              margin: [10, 0],
              layout: 'noBorders',
              table: {
                body: [
                  [
                    { text: 'Catégorie :', style: 'info' },
                    { text: `${contrat?.categorie?.code || 'N/A'}`, fontSize: 6 },
                  ],
                  [
                    { text: 'Coefficient Horaire :', style: 'info' },
                    { text: '173,33', fontSize: 6 },
                  ],
                  [
                    { text: 'Ancienneté :', style: 'info' },
                    {
                      text: contrat?.date_debut ? cal.getAnciennete(new Date(contrat.date_debut).toISOString().split('T')[0]) : 'N/A',
                      fontSize: 6,
                    },
                  ],
                  [
                    { text: 'Date de Recrutement :', style: 'info' },
                    {
                      text: contrat?.date_debut ? format(
                        new Date(contrat.date_debut),
                        'dd MMMM yyyy',
                        { locale: fr },
                      ) : 'N/A',
                      fontSize: 6,
                    },
                  ],
                ],
              },
            },
          ],
        },
        {
          margin: [2, 2, 0, 0],
          alignment: 'center',
          fillColor: 'white',
          layout: {
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          table: {
            widths: ['*', 150, '*', '*', '*', 5, 50, '*'],
            body: [
              [
                { text: '', border: [false, false, false, false] },
                { text: '', border: [false, false, false, false] },
                { text: '', border: [false, false, false, false] },
                {
                  text: 'PART SALARIALE',
                  fontSize: 6,
                  bold: true,
                  colSpan: 2,
                  border: [true, true, true, false],
                },
                '',
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                {
                  text: 'PART PATRONALE',
                  fontSize: 6,
                  bold: true,
                  colSpan: 2,
                  border: [true, true, true, false],
                },
                '',
              ],
            ],
          },
        },
        {
          margin: [2, 0, 0, 1],
          layout: {
            fillColor: (i, node) => {
              return i % 2 === 0 ? '#f5f5dc' : 'white';
            },
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          table: {
            widths: ['*', 150, '*', '*', '*', 5, 50, '*'],
            headerRows: 1,
            body: [
              [
                { text: '#', style: 'header' },
                { text: 'Rubriques', style: 'header' },
                { text: 'Base', style: 'header' },
                { text: 'Taux', style: 'header' },
                { text: 'Montant', style: 'header' },
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                { text: 'Taux', style: 'header' },
                { text: 'Montant', style: 'header' },
              ],
              ...cal
                .imposable(bulletin.lignes['gains'])
                .sort((l, r) => l.rubrique.code - r.rubrique.code)
                .map((a, i) => {
                  if (i === 0) {
                    return [
                      {
                        text: `${a.rubrique.code}`,
                        style: 'header2',
                        border: [true, true, true, false],
                      },
                      {
                        text: `${a.rubrique.libelle}`,
                        style: 'header2',
                        border: [true, true, true, false],
                      },
                      {
                        text: formatNumber(a.base) || '',
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                      {
                        text: a.taux1 || '',
                        style: 'header2',
                        border: [false, true, true, false],
                      },
                      {
                        text: formatNumber(a.montant),
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                      {
                        text: '',
                        border: [true, false, true, false],
                        fillColor: 'white',
                      },
                      {
                        text: a.taux2 || '',
                        style: 'header2',
                        border: [false, true, true, false],
                      },
                      {
                        text: a.taux2
                          ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                          : '',
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                    ];
                  }
                  return [
                    {
                      text: `${a.rubrique.code}`,
                      style: 'header2',
                      border: [true, false, true, false],
                    },
                    {
                      text: `${a.rubrique.libelle}`,
                      style: 'header2',
                      border: [true, false, true, false],
                    },
                    {
                      text: formatNumber(Math.round(a.base)) || '',
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                    {
                      text: a.taux1 || '',
                      style: 'header2',
                      border: [false, false, true, false],
                    },
                    {
                      text: formatNumber(a.montant),
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                    {
                      text: '',
                      border: [true, false, true, false],
                      fillColor: 'white',
                    },
                    {
                      text: a.taux2 || '',
                      style: 'header2',
                      border: [false, false, true, false],
                    },
                    {
                      text: a.taux2
                        ? formatNumber(
                            Math.round(Math.round((a.taux2 * a.base) / 100)),
                          )
                        : '',
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                  ];
                }),
              [
                {
                  text: 'Total Brut',
                  colSpan: 4,
                  bold: true,
                  fillColor: 'white',
                  fontSize: 6,
                },
                '',
                '',
                '',
                { text: formatNumber(cal.totalImposable), style: 'total' },
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                {
                  text: formatNumber(cal.tppi) || '',
                  style: 'total',
                  colSpan: 2,
                },
                '',
              ],
            ],
          },
        },
        {
          margin: [2, 0, 0, 1],
          layout: {
            fillColor: (i, node) => {
              return i % 2 === 0 ? '#f5f5dc' : 'white';
            },
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          table: {
            widths: ['*', 150, '*', '*', '*', 5, 50, '*'],
            headerRows: 1,
            body: [
              ...cal
                .retenues(bulletin.lignes['retenues'])
                .sort((l, r) => l.rubrique.code - r.rubrique.code)
                .map((a, i) => {
                  if (i === 0) {
                    return [
                      {
                        text: `${a.rubrique.code}`,
                        style: 'header2',
                        border: [true, true, true, false],
                      },
                      {
                        text: `${a.rubrique.libelle}`,
                        style: 'header2',
                        border: [true, true, true, false],
                      },
                      {
                        text: formatNumber(Math.round(a.base)) || '',
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                      {
                        text: a.taux1 || '',
                        style: 'header2',
                        border: [false, true, true, false],
                      },
                      {
                        text: formatNumber(Math.round(a.montant)),
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                      {
                        text: '',
                        border: [true, false, true, false],
                        fillColor: 'white',
                      },
                      {
                        text: a.taux2 || '',
                        style: 'header2',
                        border: [false, true, true, false],
                      },
                      {
                        text: a.taux2
                          ? formatNumber(
                              Math.round(Math.round((a.taux2 * a.base) / 100)),
                            )
                          : '',
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                    ];
                  }
                  return [  
                    {
                      text: `${a.rubrique.code}`,
                      style: 'header2',
                      border: [true, false, true, false],
                    },
                    {
                      text: `${a.rubrique.libelle}`,
                      style: 'header2',
                      border: [true, false, true, false],
                    },
                    {
                      text: formatNumber(Math.round(a.base)) || '',
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                    {
                      text: a.taux1 || '',
                      style: 'header2',
                      border: [false, false, true, false],
                    },
                    {
                      text: formatNumber(Math.round(a.montant)),
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                    {
                      text: '',
                      border: [true, false, true, false],
                      fillColor: 'white',
                    },
                    {
                      text: a.taux2 || '',
                      style: 'header2',
                      border: [false, false, true, false],
                    },
                    {
                      text: a.taux2
                        ? formatNumber(
                            Math.round(Math.round((a.taux2 * a.base) / 100)),
                          )
                        : '',
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                  ];
                }),
              [
                {
                  text: 'Total Retenues',
                  colSpan: 4,
                  bold: true,
                  fillColor: 'white',
                  fontSize: 6,
                },
                '',
                '',
                '',
                { text: formatNumber(cal.totalRetenue), style: 'total' },
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                {
                  text: formatNumber(cal.tppr) || '',
                  style: 'total',
                  colSpan: 2,
                },
                '',
              ],
            ],
          },
        },
        {
          margin: [2, 0, 0, 1],
          layout: {
            fillColor: (i, node) => {
              return i % 2 === 0 ? '#f5f5dc' : 'white';
            },
            paddingTop: () => 0,
            paddingBottom: () => 0,
          },
          table: {
            widths: ['*', 150, '*', '*', '*', 5, 50, '*'],
            headerRows: 1,
            body: [
              ...cal
                .nonimposable(bulletin.lignes['gains'])
                .sort((l, r) => l.rubrique.code - r.rubrique.code)
                .map((a, i) => {
                  if (i === 0) {
                    return [
                      {
                        text: `${a.rubrique.code}`,
                        style: 'header2',
                        border: [true, true, true, false],
                      },
                      {
                        text: `${a.rubrique.libelle}`,
                        style: 'header2',
                        border: [true, true, true, false],
                      },
                      {
                        text: formatNumber(Math.round(a.base)) || '',
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                      {
                        text: a.taux1 || '',
                        style: 'header2',
                        border: [false, true, true, false],
                      },
                      {
                        text: formatNumber(a.montant),
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                      {
                        text: '',
                        border: [true, false, true, false],
                        fillColor: 'white',
                      },
                      {
                        text: a.taux2 || '',
                        style: 'header2',
                        border: [false, true, true, false],
                      },
                      {
                        text: a.taux2
                          ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                          : '',
                        style: 'nombre',
                        border: [false, true, true, false],
                      },
                    ];
                  }
                  return [
                    {
                      text: `${a.rubrique.code}`,
                      style: 'header2',
                      border: [true, false, true, false],
                    },
                    {
                      text: `${a.rubrique.libelle}`,
                      style: 'header2',
                      border: [true, false, true, false],
                    },
                    {
                      text: formatNumber(a.base) || '',
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                    {
                      text: a.taux1 || '',
                      style: 'header2',
                      border: [false, false, true, false],
                    },
                    {
                      text: formatNumber(a.montant),
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                    {
                      text: '',
                      border: [true, false, true, false],
                      fillColor: 'white',
                    },
                    {
                      text: a.taux2 || '',
                      style: 'header2',
                      border: [false, false, true, false],
                    },
                    {
                      text: a.taux2
                        ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                        : '',
                      style: 'nombre',
                      border: [false, false, true, false],
                    },
                  ];
                }),
              [
                {
                  text: 'Total Non Imposable',
                  colSpan: 4,
                  bold: true,
                  fillColor: 'white',
                  fontSize: 6,
                },
                '',
                '',
                '',
                { text: formatNumber(cal.totalNomImposable), style: 'total' },
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                {
                  text: formatNumber(cal.tppni) || '',
                  style: 'total',
                  colSpan: 2,
                },
                '',
              ],
            ],
          },
        },
        {
          margin: [2, 0, 0, 1],
          table: {
            widths: ['*', '*', '*', '*', '*', 80],
            headerRows: 1,
            body: [
              [
                { text: 'Totaux', style: 'header3' },
                { text: 'Brut', style: 'header3' },
                { text: 'Charges Salariale', style: 'header3' },
                { text: 'Charges Patronales', style: 'header3' },
                { text: 'Avantages', style: 'header3' },
                { text: 'Net A Payer', style: 'header3' },
              ],
              [
                { text: 'Totaux Mensuels', style: 'header2' },
                { text: formatNumber(cal.totalImposable), style: 'nombre' },
                { text: formatNumber(cal.totalRetenue), style: 'nombre' },
                { text: formatNumber(cal.totalPp), style: 'nombre' },
                { text: formatNumber(cal.totalNomImposable), style: 'nombre' },
                {
                  text: formatNumber(
                    cal.totalImposable +
                      cal.totalNomImposable -
                      cal.totalRetenue,
                  ),
                  style: 'nombre',
                },
              ],
              [
                { text: 'Totaux Annuels', style: 'header2' },
                { text: formatNumber(totauxAnnuels.totalIm), style: 'nombre' },
                { text: formatNumber(totauxAnnuels.totalRet), style: 'nombre' },
                { text: formatNumber(totauxAnnuels.totalPP), style: 'nombre' },
                { text: formatNumber(totauxAnnuels.totalNI), style: 'nombre' },
                { text: formatNumber(totauxAnnuels.nap), style: 'nombre' },
              ],
            ],
          },
        },
      ],
      styles: {
        header: {
          border: [true, true, true, true],
          fillColor: couleur,
          bold: true,
          alignment: 'center',
          fontSize: 6,
          lineHeight: 0.8,
        },
        header2: {
          alignment: 'right',
          fontSize: 6,
          bold: true,
          lineHeight: 0.8,
        },
        nombre: {
          alignment: 'right',
          fontSize: 6,
          bold: true,
          lineHeight: 0.8,
        },
        info: {
          fontSize: 6,
          lineHeight: 0.8,
        },
        header3: {
          fillColor: couleur,
          bold: true,
          alignment: 'center',
          fontSize: 6,
          lineHeight: 0.8,
        },
        header4: {
          fillColor: couleur,
          bold: true,
          alignment: 'right',
          fontSize: 6,
          lineHeight: 0.8,
        },
        total: {
          bold: true,
          fontSize: 6,
          fillColor: couleur,
          alignment: 'center',
          lineHeight: 0.8,
        },
        anotherStyle: {
          italics: true,
          alignment: 'right',
          lineHeight: 0.8,
        },
      },
    };
    const pdfDoc = PdfPrinter.createPdf(docDefinition as any);
    const key = `bulletins/${idlot}-${employe._id}-${mois}-${annee}.pdf`;
    return await this.uploadPdf(pdfDoc, key);
  }



  async makeCDD(bulletin: Bulletin, lot: Lot, contrat?: any, couleur = '#fac66b') {
    const { mois, annee, debut, fin, etat, _id: idlot } = lot;
    const employe = bulletin['employe'] as any;
    const debutStr = format(parse(debut, 'yyyy-MM-dd', new Date()), 'dd', { locale: fr });
    const finStr = format(parse(fin, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: fr }).toUpperCase();
    const wm = etat === 'VALIDE' ? annee : 'BROUILLON';

    const gains = (bulletin.lignes as any)?.gains ?? [];
    const retenues = (bulletin.lignes as any)?.retenues ?? [];

    const gainRows = gains.map((g: any) => [
      { text: g.rubrique?.libelle ?? '', fontSize: 8 },
      { text: formatNumber(round(g.montant || 0)), fontSize: 8 },
    ]);
    const retenueRows = retenues.map((r: any) => [
      { text: r.rubrique?.libelle ?? '', fontSize: 8 },
      { text: formatNumber(round(r.montant || 0)), fontSize: 8 },
    ]);

    const totalGains = round((bulletin.totalIm || 0) + (bulletin.totalNI || 0));

    const docDefinition = {
      footer: function () {
        return {
          text: 'DANS VOTRE INTERET ET POUR VOUS AIDER A FAIRE VALOIR VOS DROITS, CONSERVER CE BULLETIN DE PAIE SANS LIMITATION DE DUREE',
          fontSize: 6,
          alignment: 'center' as const,
          italics: true,
        };
      },
      watermark: {
        text: `Bulletin CROUS/Z ${wm}`,
        color: etat === 'VALIDE' ? 'grey' : 'red',
        opacity: 0.1,
        bold: true,
        italics: false,
      },
      content: [
        {
          columns: [
            {
              width: '50%',
              alignment: 'left',
              stack: [
                {
                  text: 'REPUBLIQUE DU SENEGAL\n',
                  fontSize: 6,
                  bold: true,
                  alignment: 'center',
                },
                {
                  text: 'Un Peuple, Un but, Une Foi\n',
                  fontSize: 6,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  image: 'src/helpers/drapeau.jpg',
                  width: 40,
                  alignment: 'center',
                },
                {
                  text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                  fontSize: 6,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                  fontSize: 6,
                  bold: true,
                  alignment: 'center',
                },
                {
                  text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                  fontSize: 6,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  text: 'SOCIALES DE ZIGUINCHOR',
                  fontSize: 6,
                  bold: true,
                  alignment: 'center',
                },
              ],
            },
            {
              width: '50%',
              alignment: 'center',
              stack: [
                {
                  image: 'src/helpers/logo.png',
                  width: 80,
                  margin: [10, 2],
                },
                {
                  text: `Du ${debutStr} Au ${finStr}`,
                  fontSize: 6,
                  bold: true,
                },
              ],
            },
          ],
        },
        {
          margin: [6, 15],
          fillColor: couleur,
          alignment: 'center',
          layout: 'noBorders',
          table: {
            widths: ['*'],
            body: [ 
              [
                {
                  text: 'BULLETIN DE PAIE',
                  fontSize: 12,
                  bold: true,
                  alignment: 'center',
                },
              ],
            ],
          },
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: `Prénoms: ${employe?.prenom ?? ''}`, fontSize: 9 },
                { text: `Période: ${debutStr} au ${finStr}`, fontSize: 9, bold: true },
              ],
              [
                { text: `Nom: ${employe?.nom ?? ''}`, fontSize: 9, colSpan: 2 },
                {},
              ],
              [
                { text: `Emploi : ${contrat?.poste?.nom ?? 'N/A'}`, fontSize: 9, bold: true, colSpan: 2 },
                {},
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Gains', bold: true, fontSize: 9 },
                { text: 'Montant', bold: true, fontSize: 9, alignment: 'right' },
              ],
              ...gainRows.map(([libelle, montant]: any[]) => [libelle, { ...montant, alignment: 'right' }]),
              [
                { text: 'Total:', bold: true, fontSize: 9 },
                { text: formatNumber(totalGains), bold: true, fontSize: 9, alignment: 'right' },
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Retenues', bold: true, fontSize: 9 },
                { text: 'Montant', bold: true, fontSize: 9, alignment: 'right' },
              ],
              ...retenueRows.map(([libelle, montant]: any[]) => [libelle, { ...montant, alignment: 'right' }]),
              [
                { text: 'Total Retenues:', bold: true, fontSize: 9 },
                { text: formatNumber(round(bulletin.totalRet || 0)), bold: true, fontSize: 9, alignment: 'right' },
              ],
            ],
          },
          margin: [0, 0, 0, 10],
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [
                { text: 'Net A Payer:', bold: true, fontSize: 10 },
                { text: formatNumber(round(bulletin.nap || 0)), bold: true, fontSize: 10, alignment: 'right' },
              ],
            ],
          },
        },
      ],
      defaultStyle: { font: 'Roboto' },
    };

    const pdfDoc = PdfPrinter.createPdf(docDefinition as any);
    const key = `bulletins/cdd/${idlot}-${employe._id}-${mois}-${annee}.pdf`;
    return await this.uploadPdf(pdfDoc, key);
  }

  async makeAll(
    bulletins: Bulletin[],
    lot: Lot,
    prevR: Lot[] | null,
    couleur = '#fac66b',
  ) {
    const grandeLigne = [];
    let totalGrandeLigne = { brut: 0, retenues: 0, pp:0, avantages: 0, nap: 0,brutGlobal:0 };
    const cal2 = new Calcul();
    const { mois, annee, etat, _id } = lot;
    const wm = etat === 'VALIDE' ? annee : 'BROUILLON';
    const docDefinition = {
      footer: function (currentPage, pageCount) {
        return {
          text: 'DANS VOTRE INTERET ET POUR VOUS AIDER A FAIRE VALOIR VOS DROITS, CONSERVER CE BULLETIN DE PAIE SANS LIMITATION DE DUREE',
          fontSize: 6,
          alignment: 'center' as const,
          italics: true,
        };
      },
      watermark: {
        text: `Bulletin CROUS/Z ${wm}`,
        color: etat === 'VALIDE' ? 'grey' : 'red',
        opacity: 0.3,
        bold: true,
        italics: false,
      },
      content: [],
      styles: {
        header: {
          border: [true, true, true, true],
          fillColor: couleur,
          bold: true,
          alignment: 'center',
          fontSize: 6,
          lineHeight: 0.8,
        },
        header2: {
          alignment: 'right',
          fontSize: 6,
          bold: true,
          lineHeight: 0.8,
        },
        nombre: {
          alignment: 'right',
          fontSize: 6,
          bold: true,
          lineHeight: 0.8,
        },
        info: {
          fontSize: 6,
          lineHeight: 0.8,
        },
        header3: {
          fillColor: couleur,
          bold: true,
          alignment: 'center',
          fontSize: 6,
          lineHeight: 0.8,
        },
        header4: {
          fillColor: couleur,
          bold: true,
          alignment: 'right',
          fontSize: 6,
          lineHeight: 0.8,
        },
        total: {
          bold: true,
          fontSize: 6,
          fillColor: couleur,
          alignment: 'center',
          lineHeight: 0.8,
        },
        anotherStyle: {
          italics: true,
          alignment: 'right',
          lineHeight: 0.8,
        },
      },
    };
    bulletins.forEach((bulletin) => {
      const gl = cal2.getTotal(bulletin);
        grandeLigne.push({
          nom: `${bulletin.employe['nom']}`,
          prenom: `${bulletin.employe['prenom']}`,
          mats: `${bulletin['contrat_actif']?.matricule_de_solde || 'N/A'}`,
          fonc: `${bulletin['contrat_actif']?.poste?.nom || 'N/A'}`,
          cat: `${bulletin['contrat_actif']?.categorie?.code || 'N/A'}`,
          brut: `${bulletin.totalIm}`,
          retenues: `${bulletin.totalRet}`,
          pp: `${bulletin.totalPP}`,
          avantages: `${bulletin.totalNI}`,
          nap: `${bulletin.nap}`,
          brutGlobale: gl.totalIm + gl.totalNI + gl.totalPP,
        });

        const currentEmpId = (bulletin.employe as any)?._id?.toString() ?? (bulletin.employe as any)?.toString();
        const olds = [];
        prevR.forEach((r:any) => {
          olds.push(
            r?.bulletins?.filter(({ employe }: any) => {
              const prevEmpId = employe?._id?.toString() ?? employe?.toString();
              return prevEmpId === currentEmpId;
            }) ?? []
          );
        })

        const { debut, fin } = lot as Lot;
        const debutStr = format(
          parse(debut, 'yyyy-MM-dd', new Date()),
          'dd MMMM yyyy',
          { locale: fr },
        );
        const finStr = format(
          parse(fin, 'yyyy-MM-dd', new Date()),
          'dd MMMM yyyy',
          { locale: fr },
        );
        const anneeStr = format(
          parse(debut, 'yyyy-MM-dd', new Date()),
          'MMMM',
          { locale: fr },
        ).toUpperCase();
        const employe = bulletin.employe as any;
        const cal = new Calcul();
        const totauxAnnuels = cal.getTotauxAnnuel([...flatten(olds), bulletin]);
        docDefinition.content.push([
          {
            columns: [
              {
                with: '20%',
                alignment: 'left',
                stack: [
                  {
                    text: 'REPUBLIQUE DU SENEGAL\n',
                    fontSize: 6,
                    bold: true,
                    alignment: 'center',
                  },
                  {
                    text: 'Un Peuple, Un but, Une Foi\n',
                    fontSize: 6,
                    bold: true,
                    margin: [0, 2],
                    alignment: 'center',
                  },
                  {
                    image: 'src/helpers/drapeau.jpg',
                    width: 40,
                    alignment: 'center',
                  },
                  {
                    text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                    fontSize: 6,
                    bold: true,
                    margin: [0, 2],
                    alignment: 'center',
                  },
                  {
                    text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                    fontSize: 6,
                    bold: true,
                    alignment: 'center',
                  },
                  {
                    text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                    fontSize: 6,
                    bold: true,
                    margin: [0, 2],
                    alignment: 'center',
                  },
                  {
                    text: 'SOCIALES DE ZIGUINCHOR',
                    fontSize: 6,
                    bold: true,
                    alignment: 'center',
                  },
                ],
              },
              {
                qr: `${lot._id}:${bulletin.employe.toString()}`,
                fit: 80,
                alignment: 'center',
                eccLevel: 'M',
              },
              {
                with: '20%',
                alignment: 'right',
                stack: [
                  {
                    image: 'src/helpers/logo.png',
                    width: 80,
                    margin: [10, 2],
                  },
                  {
                    text: `Du ${debutStr} Au ${finStr}`,
                    fontSize: 6,
                    bold: true,
                  },
                ],
              },
            ],
          },
          {
            margin: [50, 5],
            fillColor: couleur,
            alignment: 'center',
            layout: 'noBorders',
            table: {
              widths: [400],
              body: [
                [
                  {
                    text: 'BULLETIN DE PAIE',
                    fontSize: 16,
                    bold: true,
                    margin: [0, 2],
                  },
                ],
              ],
            },
          },
          {
            columns: [
              {
                with: 'auto',
                alignment: 'right',
                fontSize: 6,
                italics: true,
                text: `BULLETINS DU MOIS DE ${anneeStr}\n`,
              },
            ],
          },
          {
            columns: [
              {
                alignment: 'left',
                margin: [10, 0],
                layout: 'noBorders',
                table: {
                  body: [
                    [
                      { text: 'Prenom et Nom :', style: 'info' },
                      { text: `${employe.prenom} ${employe.nom}`, fontSize: 6 },
                    ],
                    [
                      { text: 'Matricule de Solde :', style: 'info' },
                      { text: `${bulletin['contrat_actif']?.matricule_de_solde || 'N/A'}`, fontSize: 6 },
                    ],
                    [
                      { text: 'Emploi :', style: 'info' },
                      { text: `${bulletin['contrat_actif']?.poste?.nom || 'N/A'}`, fontSize: 6 },
                    ],
                    [
                      { text: 'Nombre de parts :', style: 'info' },
                      { text: `${bulletin['contrat_actif']?.nombre_de_parts || 'N/A'}`, fontSize: 6 },
                    ],
                    [
                      { text: 'Contrat :', style: 'info' },
                      { text: `${bulletin['contrat_actif']?.type || 'N/A'}`, fontSize: 6 },
                    ],
                  ],
                },
              },
              {
                alignment: 'left',
                margin: [10, 0],
                layout: 'noBorders',
                table: {
                  body: [
                    [
                      { text: 'Catégorie :', style: 'info' },
                      { text: `${bulletin['contrat_actif']?.categorie?.code || 'N/A'}`, fontSize: 6 },
                    ],
                    [
                      { text: 'Coefficient Horaire :', style: 'info' },
                      { text: '173,33', fontSize: 6 },
                    ],
                    [
                      { text: 'Ancienneté :', style: 'info' },
                      {
                        text: bulletin['contrat_actif']?.date_debut ? cal.getAnciennete(new Date(bulletin['contrat_actif'].date_debut).toISOString().split('T')[0]) : 'N/A',
                        fontSize: 6,
                      },
                    ],
                    [
                      { text: 'Date de Recrutement :', style: 'info' },
                      {
                        text: bulletin['contrat_actif']?.date_debut ? format(
                          new Date(bulletin['contrat_actif'].date_debut),
                          'dd MMMM yyyy',
                          { locale: fr },
                        ) : 'N/A',
                        fontSize: 6,
                      },
                    ],
                  ],
                },
              },
            ],
          },
          {
            margin: [2, 0, 0, 1],
            alignment: 'center',
            fillColor: 'white',
            table: {
              widths: ['*', 150, '*', '*', '*', 5, 50, '*'],
              body: [
                [
                  { text: '', border: [false, false, false, false] },
                  { text: '', border: [false, false, false, false] },
                  { text: '', border: [false, false, false, false] },
                  {
                    text: 'PART SALARIALE',
                    fontSize: 6,
                    bold: true,
                    colSpan: 2,
                    border: [true, true, true, false],
                  },
                  '',
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  {
                    text: 'PART PATRONALE',
                    fontSize: 6,
                    bold: true,
                    colSpan: 2,
                    border: [true, true, true, false],
                  },
                  '',
                ],
              ],
            },
          },
          {
            margin: [2, 0, 0, 2],
            layout: {
              fillColor: (i, node) => {
                return i % 2 === 0 ? '#f5f5dc' : 'white';
              },
              paddingTop: () => 0,
              paddingBottom: () => 0,
            },
            table: {
              widths: ['*', 150, '*', '*', '*', 5, 50, '*'],
              headerRows: 1,
              body: [
                [
                  { text: '#', style: 'header' },
                  { text: 'Rubriques', style: 'header' },
                  { text: 'Base', style: 'header' },
                  { text: 'Taux', style: 'header' },
                  { text: 'Montant', style: 'header' },
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  { text: 'Taux', style: 'header' },
                  { text: 'Montant', style: 'header' },
                ],
                ...cal
                  .imposable(bulletin.lignes['gains'])
                  .sort((l, r) => l.rubrique.code - r.rubrique.code)
                  .map((a, i) => {
                    if (i === 0) {
                      return [
                        {
                          text: `${a.rubrique.code}`,
                          style: 'header2',
                          border: [true, true, true, false],
                        },
                        {
                          text: `${a.rubrique.libelle}`,
                          style: 'header2',
                          border: [true, true, true, false],
                        },
                        {
                          text: formatNumber(a.base) || '',
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                        {
                          text: a.taux1 || '',
                          style: 'header2',
                          border: [false, true, true, false],
                        },
                        {
                          text: formatNumber(a.montant),
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                        {
                          text: '',
                          border: [true, false, true, false],
                          fillColor: 'white',
                        },
                        {
                          text: a.taux2 || '',
                          style: 'header2',
                          border: [false, true, true, false],
                        },
                        {
                          text: a.taux2
                            ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                            : '',
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                      ];
                    }
                    return [
                      {
                        text: `${a.rubrique.code}`,
                        style: 'header2',
                        border: [true, false, true, false],
                      },
                      {
                        text: `${a.rubrique.libelle}`,
                        style: 'header2',
                        border: [true, false, true, false],
                      },
                      {
                        text: formatNumber(a.base) || '',
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                      {
                        text: a.taux1 || '',
                        style: 'header2',
                        border: [false, false, true, false],
                      },
                      {
                        text: formatNumber(a.montant),
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                      {
                        text: '',
                        border: [true, false, true, false],
                        fillColor: 'white',
                      },
                      {
                        text: a.taux2 || '',
                        style: 'header2',
                        border: [false, false, true, false],
                      },
                      {
                        text: a.taux2
                          ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                          : '',
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                    ];
                  }),
                [
                  {
                    text: 'Total Brut',
                    colSpan: 4,
                    bold: true,
                    fillColor: 'white',
                    fontSize: 6,
                  },
                  '',
                  '',
                  '',
                  { text: formatNumber(cal.totalImposable), style: 'total' },
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  {
                    text: formatNumber(cal.tppi) || '',
                    style: 'total',
                    colSpan: 2,
                  },
                  '',
                ],
              ],
            },
          },
          {
            margin: [2, 0, 0, 2],
            layout: {
              fillColor: (i, node) => {
                return i % 2 === 0 ? '#f5f5dc' : 'white';
              },
              paddingTop: () => 0,
              paddingBottom: () => 0,
            },
            table: {
              widths: ['*', 150, '*', '*', '*', 5, 50, '*'],
              headerRows: 1,
              body: [
                ...cal
                  .retenues(bulletin.lignes['retenues'])
                  .sort((l, r) => l.rubrique.code - r.rubrique.code)
                  .map((a, i) => {
                    if (i === 0) {
                      return [
                        {
                          text: `${a.rubrique.code}`,
                          style: 'header2',
                          border: [true, true, true, false],
                        },
                        {
                          text: `${a.rubrique.libelle}`,
                          style: 'header2',
                          border: [true, true, true, false],
                        },
                        {
                          text: formatNumber(a.base) || '',
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                        {
                          text: a.taux1 || '',
                          style: 'header2',
                          border: [false, true, true, false],
                        },
                        {
                          text: formatNumber(a.montant),
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                        {
                          text: '',
                          border: [true, false, true, false],
                          fillColor: 'white',
                        },
                        {
                          text: a.taux2 || '',
                          style: 'header2',
                          border: [false, true, true, false],
                        },
                        {
                          text: a.taux2
                            ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                            : '',
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                      ];
                    }
                    return [
                      {
                        text: `${a.rubrique.code}`,
                        style: 'header2',
                        border: [true, false, true, false],
                      },
                      {
                        text: `${a.rubrique.libelle}`,
                        style: 'header2',
                        border: [true, false, true, false],
                      },
                      {
                        text: formatNumber(a.base) || '',
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                      {
                        text: a.taux1 || '',
                        style: 'header2',
                        border: [false, false, true, false],
                      },
                      {
                        text: formatNumber(a.montant),
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                      {
                        text: '',
                        border: [true, false, true, false],
                        fillColor: 'white',
                      },
                      {
                        text: a.taux2 || '',
                        style: 'header2',
                        border: [false, false, true, false],
                      },
                      {
                        text: a.taux2
                          ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                          : '',
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                    ];
                  }),
                [
                  {
                    text: 'Total Retenues',
                    colSpan: 4,
                    bold: true,
                    fillColor: 'white',
                    fontSize: 6,
                  },
                  '',
                  '',
                  '',
                  { text: formatNumber(cal.totalRetenue), style: 'total' },
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  {
                    text: formatNumber(cal.tppr) || '',
                    style: 'total',
                    colSpan: 2,
                  },
                  '',
                ],
              ],
            },
          },
          {
            margin: [2, 0, 0, 2],
            layout: {
              fillColor: (i, node) => {
                return i % 2 === 0 ? '#f5f5dc' : 'white';
              },
              paddingTop: () => 0,
              paddingBottom: () => 0,
            },
            table: {
              widths: ['*', 150, '*', '*', '*', 5, 50, '*'],
              headerRows: 1,
              body: [
                ...cal
                  .nonimposable(bulletin.lignes['gains'])
                  .sort((l, r) => l.rubrique.code - r.rubrique.code)
                  .map((a, i) => {
                    if (i === 0) {
                      return [
                        {
                          text: `${a.rubrique.code}`,
                          style: 'header2',
                          border: [true, true, true, false],
                        },
                        {
                          text: `${a.rubrique.libelle}`,
                          style: 'header2',
                          border: [true, true, true, false],
                        },
                        {
                          text: formatNumber(a.base) || '',
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                        {
                          text: a.taux1 || '',
                          style: 'header2',
                          border: [false, true, true, false],
                        },
                        {
                          text: formatNumber(a.montant),
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                        {
                          text: '',
                          border: [true, false, true, false],
                          fillColor: 'white',
                        },
                        {
                          text: a.taux2 || '',
                          style: 'header2',
                          border: [false, true, true, false],
                        },
                        {
                          text: a.taux2
                            ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                            : '',
                          style: 'nombre',
                          border: [false, true, true, false],
                        },
                      ];
                    }
                    return [
                      {
                        text: `${a.rubrique.code}`,
                        style: 'header2',
                        border: [true, false, true, false],
                      },
                      {
                        text: `${a.rubrique.libelle}`,
                        style: 'header2',
                        border: [true, false, true, false],
                      },
                      {
                        text: formatNumber(a.base) || '',
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                      {
                        text: a.taux1 || '',
                        style: 'header2',
                        border: [false, false, true, false],
                      },
                      {
                        text: formatNumber(a.montant),
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                      {
                        text: '',
                        border: [true, false, true, false],
                        fillColor: 'white',
                      },
                      {
                        text: a.taux2 || '',
                        style: 'header2',
                        border: [false, false, true, false],
                      },
                      {
                        text: a.taux2
                          ? formatNumber(Math.round((a.taux2 * a.base) / 100))
                          : '',
                        style: 'nombre',
                        border: [false, false, true, false],
                      },
                    ];
                  }),
                [
                  {
                    text: 'Total Non Imposable',
                    colSpan: 4,
                    bold: true,
                    fillColor: 'white',
                    fontSize: 6,
                  },
                  '',
                  '',
                  '',
                  { text: formatNumber(cal.totalNomImposable), style: 'total' },
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  {
                    text: formatNumber(cal.tppni) || '',
                    style: 'total',
                    colSpan: 2,
                  },
                  '',
                ],
              ],
            },
          },
          {
            margin: [2, 0, 0, 1],
            pageBreak: 'after',
            table: {
              widths: ['*', '*', '*', '*', '*', 80],
              headerRows: 1,
              body: [
                [
                  { text: 'Totaux', style: 'header3' },
                  { text: 'Brut', style: 'header3' },
                  { text: 'Charges Salariale', style: 'header3' },
                  { text: 'Charges Patronales', style: 'header3' },
                  { text: 'Avantages', style: 'header3' },
                  { text: 'Net A Payer', style: 'header3' },
                ],
                [
                  { text: 'Totaux Mensuels', style: 'header2' },
                  { text: formatNumber(cal.totalImposable), style: 'nombre' },
                  { text: formatNumber(cal.totalRetenue), style: 'nombre' },
                  { text: formatNumber(cal.totalPp), style: 'nombre' },
                  {
                    text: formatNumber(cal.totalNomImposable),
                    style: 'nombre',
                  },
                  {
                    text: formatNumber(
                      cal.totalImposable +
                        cal.totalNomImposable -
                        cal.totalRetenue,
                    ),
                    style: 'nombre',
                  },
                ],
                [
                  { text: 'Totaux Annuels', style: 'header2' },
                  {
                    text: formatNumber(totauxAnnuels.totalIm),
                    style: 'nombre',
                  },
                  {
                    text: formatNumber(totauxAnnuels.totalRet),
                    style: 'nombre',
                  },
                  {
                    text: formatNumber(totauxAnnuels.totalPP),
                    style: 'nombre',
                  },
                  {
                    text: formatNumber(totauxAnnuels.totalNI),
                    style: 'nombre',
                  },
                  { text: formatNumber(totauxAnnuels.nap), style: 'nombre' },
                ],
              ],
            },
          },
        ]);
      });
      totalGrandeLigne = grandeLigne.reduce(
      (acc, cur) => {
        acc.retenues += round(cur.retenues);
        acc.avantages += round(cur.avantages);
        acc.brut += round(cur.brut);
        acc.nap += round(cur.nap);
        acc.pp += round(cur.pp);
        acc.brutGlobale += round(cur.brutGlobale);
        return acc;
      },
      { brut: 0, retenues: 0, avantages: 0,pp:0, nap: 0,brutGlobal:0 },
    );
    docDefinition.content.push([
      {
        columns: [
          {
            with: '20%',
            alignment: 'left',
            stack: [
              {
                text: 'REPUBLIQUE DU SENEGAL\n',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'Un Peuple, Un but, Une Foi\n',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                image: 'src/helpers/drapeau.jpg',
                width: 40,
                alignment: 'center',
              },
              {
                text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: 'SOCIALES DE ZIGUINCHOR',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            with: '20%',
            alignment: 'right',
            stack: [
              {
                image: 'src/helpers/logo.png',
                width: 100,
                margin: [10, 2],
              },
              {
                text: `Du ${format(
                  parse(lot.debut, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )} Au ${format(
                  parse(lot.fin, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )}`,
                fontSize: 6,
                bold: true,
              },
            ],
          },
        ],
      },
      {
        margin: [30, 5],
        fillColor: couleur,
        alignment: 'center',
        layout: 'noBorders',
        table: {
          widths: [400],
          body: [
            [
              {
                text: 'TABLEAU DES GRANDES LIGNES',
                fontSize: 16,
                bold: true,
                color: 'white',
                margin: [0, 4],
              },
            ],
          ],
        },
      },
      {
        margin: [2, 0, 0, 1],
        layout: {
          fillColor: (i, node) => {
            return i % 2 === 0 ? '#f5f5dc' : 'white';
          },
        },
        pageBreak: 'after',
        table: {
          widths: [20, 50,60,90, '*', '*', '*', '*','*'],
          headerRows: 1,
          body: [
            [
              { text: 'N°', style: 'header3' },
              { text: 'Mat', style: 'header3' },
              { text: 'Nom', style: 'header3' },
              { text: 'Prenom', style: 'header3' },
              { text: 'Brut', style: 'header3' },
              { text: 'Ret', style: 'header3' },
              { text: 'Part P.', style: 'header3' },
              { text: 'Avantages', style: 'header3' },
              { text: 'Net', style: 'header3' },
            ],
            ...grandeLigne.sort((a,b) => a.nom.toLowerCase().localeCompare(b.nom.toLowerCase())).map((g, i) => [
              { text: i + 1, style: 'header2' },
              { text: g.mats, style: 'header2' },
              { text: g.nom, style: 'header2' },
              { text: g.prenom, style: 'header2' },
              { text: formatNumber(g.brut), style: 'nombre' },
              { text: formatNumber(g.retenues), style: 'nombre' },
              { text: formatNumber(g.pp), style: 'nombre' },
              { text: formatNumber(g.avantages), style: 'nombre' },
              { text: formatNumber(g.nap), style: 'nombre' },
            ]),
            [
              { text: 'Totaux', bold: true, colSpan: 4 },
              '',
              '',
              '',
              {
                text: formatNumber(totalGrandeLigne.brut),
                bold: true,
                style: 'nombre',
              },
              {
                text: formatNumber(totalGrandeLigne.retenues),
                bold: true,
                style: 'nombre',
              },
              {
                text: formatNumber(totalGrandeLigne.pp),
                bold: true,
                style: 'nombre',
              },
              {
                text: formatNumber(totalGrandeLigne.avantages),
                bold: true,
                style: 'nombre',
              },
              {
                text: formatNumber(totalGrandeLigne.nap),
                bold: true,
                style: 'nombre',
              },
            ],
          ],
        },
      },
    ]);
    docDefinition.content.push([
      {
        columns: [
          {
            with: '20%',
            alignment: 'left',
            stack: [
              {
                text: 'REPUBLIQUE DU SENEGAL\n',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'Un Peuple, Un but, Une Foi\n',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                image: 'src/helpers/drapeau.jpg',
                width: 40,
                alignment: 'center',
              },
              {
                text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: 'SOCIALES DE ZIGUINCHOR',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            with: '20%',
            alignment: 'right',
            stack: [
              {
                image: 'src/helpers/logo.png',
                width: 100,
                margin: [10, 2],
              },
              {
                text: `Du ${format(
                  parse(lot.debut, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )} Au ${format(
                  parse(lot.fin, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )}`,
                fontSize: 6,
                bold: true,
              },
            ],
          },
        ],
      },
      {
        margin: [30, 5],
        fillColor: couleur,
        alignment: 'center',
        layout: 'noBorders',
        table: {
          widths: [400],
          body: [
            [
              {
                text: 'TABLEAU DES GRANDES LIGNES 2',
                fontSize: 16,
                bold: true,
                color: 'white',
                margin: [0, 4],
              },
            ],
          ],
        },
      },
      {
        margin: [2, 0, 0, 1],
        layout: {
          fillColor: (i, node) => {
            return i % 2 === 0 ? '#f5f5dc' : 'white';
          },
        },
        pageBreak: 'after',
        table: {
          widths: [20, 50,60,90, '*', 60],
          headerRows: 1,
          body: [
            [
              { text: 'N°', style: 'header3' },
              { text: 'Mat', style: 'header3' },
              { text: 'Nom', style: 'header3' },
              { text: 'Prenom', style: 'header3' },
              { text: 'Fonction', style: 'header3' },
              { text: 'Net', style: 'header3' },
            ],
            ...grandeLigne.sort((a,b) => a.nom.toLowerCase().localeCompare(b.nom.toLowerCase())).map((g, i) => [
              { text: i + 1, style: 'header2' },
              { text: g.mats, style: 'header2' },
              { text: g.nom, style: 'header2' },
              { text: g.prenom, style: 'header2' },
              { text: g.fonc, style: 'header2' },
              { text: formatNumber(g.nap), style: 'nombre' },
            ]),
            [
              { text: 'Totaux', bold: true, colSpan: 5 },
              '',
              '',
              '',
              '',
              {
                text: formatNumber(totalGrandeLigne.nap),
                bold: true,
                style: 'nombre',
              },
            ],
          ],
        },
      },
    ]);

    docDefinition.content.push([
      {
        columns: [
          {
            with: '20%',
            alignment: 'left',
            stack: [
              {
                text: 'REPUBLIQUE DU SENEGAL\n',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'Un Peuple, Un but, Une Foi\n',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                image: 'src/helpers/drapeau.jpg',
                width: 40,
                alignment: 'center',
              },
              {
                text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: 'SOCIALES DE ZIGUINCHOR',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            with: '20%',
            alignment: 'right',
            stack: [
              {
                image: 'src/helpers/logo.png',
                width: 100,
                margin: [10, 2],
              },
              {
                text: `Du ${format(
                  parse(lot.debut, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )} Au ${format(
                  parse(lot.fin, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )}`,
                fontSize: 6,
                bold: true,
              },
            ],
          },
        ],
      },
      {
        margin: [30, 5],
        fillColor: couleur,
        alignment: 'center',
        layout: 'noBorders',
        table: {
          widths: [400],
          body: [
            [
              {
                text: 'LISTE DES AGENTS',
                fontSize: 16,
                bold: true,
                color: 'white',
                margin: [0, 4],
              },
            ],
          ],
        },
      },
      {
        margin: [2, 0, 0, 1],
        layout: {
          fillColor: (i, node) => {
            return i % 2 === 0 ? '#f5f5dc' : 'white';
          },
        },
        pageBreak: 'after',
        table: {
          widths: [20,60,'*','*', '*', '*'],
          headerRows: 1,
          body: [
            [
              { text: 'N°', style: 'header3' },
              { text: 'Nom', style: 'header3' },
              { text: 'Prenom', style: 'header3' },
              {text:'fonction',style:'header3'},
              {text:'brut globale',style:'header3'},
              { text: 'Categorie', style: 'header3' },
            ],
            ...grandeLigne.sort((a,b) => a.cat - b.cat).map((g, i) => [
              { text: i + 1, style: 'header2' },
              { text: g.nom, style: 'header2' },
              { text: g.prenom, style: 'header2' },
              { text: g.fonc, style: 'header2' },
              { text: g.brutGlobale, style: 'header2' },
              { text: g.cat, style: 'header2' },
            ]),
            [
              { text: 'Totaux', bold: true, colSpan: 4 },
              '',
              '',
              '',
              {
                text: formatNumber(grandeLigne.reduce((a, b) => a + b.brutGlobale, 0)),
                bold: true,
                style: 'nombre',
              },
              ''
            ],
          ],
        },
      },
    ]);
    const IRCC = [];
    const IRG = [];
    const CSS = [];
    const IMPSR = [];
    const FNR = [];
    bulletins.forEach((b) => {
      const l = { employe: null, ligne: null, contrat_actif: b['contrat_actif'] };
      const l2 = { employe: null, ligne: null, contrat_actif: b['contrat_actif'] };
      const l3 = { employe: null, at: null, af: null, contrat_actif: b['contrat_actif'] };
      const l4 = { employe: null, imp: null, trf: null, contrat_actif: b['contrat_actif'] };
      const l5 = { employe: null, ligne: null, contrat_actif: b['contrat_actif'] };
      l.employe = b.employe;
      l2.employe = b.employe;
      l3.employe = b.employe;
      l4.employe = b.employe;
      l5.employe = b.employe;
      l.ligne = b.lignes['retenues'].find((r) => r.rubrique.code === 1010);
      if (l.ligne) {
        IRCC.push(l);
      }
      l2.ligne = b.lignes['retenues'].find((r) => r.rubrique.code === 1000);
      if (l2.ligne) {
        IRG.push(l2);
      }

      l3.at = b.lignes['retenues'].find((r) => r.rubrique.code === 1040) ?? {
        montant: 0,
        base: 0,
        taux2: 1,
        taux1: 1,
      };

      l3.af = b.lignes['retenues'].find((r) => r.rubrique.code === 1050) ?? {
        montant: 0,
        base: 0,
        taux2: 1,
        taux1: 1,
      };
      if (l3.at || l3.af) {
        CSS.push(l3);
      }

      l4.imp = b.lignes['retenues'].find((r) => r.rubrique.code === 1080) ?? {
        montant: 0,
        base: 0,
        taux2: 1,
        taux1: 1,
      };
      l4.trf = b.lignes['retenues'].find((r) => r.rubrique.code === 1999) ?? {
        montant: 0,
        base: 0,
        taux2: 1,
        taux1: 1,
      };
      if (l4.imp || l4.imp) {
        IMPSR.push(l4);
      }

      l5.ligne = b.lignes['retenues'].find((r) => r.rubrique.code === 1013);
      if (l5.ligne) {
        FNR.push(l5);
      }
    });
    const { t1, t2 } = IRCC.reduce(
      (acc, cur) => {
        acc.t1 += cur.ligne.montant;
        acc.t2 += Math.round((cur.ligne.taux2 * cur.ligne.base) / 100);
        return acc;
      },
      { t1: 0, t2: 0 },
    );
    const { t3, t4 } = IRG.reduce(
      (acc, cur) => {
        acc.t3 += cur.ligne.montant;
        acc.t4 += Math.round((cur.ligne.taux2 * cur.ligne.base) / 100);
        return acc;
      },
      { t3: 0, t4: 0 },
    );
    const { t5, t6 } = CSS.reduce(
      (acc, cur) => {
        acc.t5 += cur.at.base / 100;
        acc.t6 += Math.round((cur.af.taux2 * cur.af.base) / 100);
        return acc;
      },
      { t5: 0, t6: 0 },
    );

    const { t7, t8, ti } = IMPSR.reduce(
      (acc, cur) => {
        acc.ti += (cur?.imp?.montant ?? 0) + (cur?.trf?.montant ?? 0);
        acc.t7 += cur?.imp?.montant ?? 0;
        acc.t8 += cur?.trf?.montant ?? 0;
        return acc;
      },
      { t7: 0, t8: 0, ti: 0 },
    );
    const { t9, t10 } = FNR.reduce(
      (acc, cur) => {
        acc.t9 += cur.ligne.montant;
        acc.t10 += Math.round((cur.ligne.taux2 * cur.ligne.base) / 100);
        return acc;
      },
      { t9: 0, t10: 0 },
    );
    docDefinition.content.push([
      {
        columns: [
          {
            with: '20%',
            alignment: 'left',
            stack: [
              {
                text: 'REPUBLIQUE DU SENEGAL\n',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'Un Peuple, Un but, Une Foi\n',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                image: 'src/helpers/drapeau.jpg',
                width: 40,
                alignment: 'center',
              },
              {
                text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: 'SOCIALES DE ZIGUINCHOR',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            with: '20%',
            alignment: 'right',
            stack: [
              {
                image: 'src/helpers/logo.png',
                width: 100,
                margin: [10, 2],
              },
              {
                text: `Du ${format(
                  parse(lot.debut, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )} Au ${format(
                  parse(lot.fin, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )}`,
                fontSize: 6,
                bold: true,
              },
            ],
          },
        ],
      },
      {
        margin: [30, 15],
        fillColor: couleur,
        alignment: 'center',
        layout: 'noBorders',
        table: {
          widths: [400],
          body: [
            [
              {
                text: 'IPRES REGIME COMPLEMENTAIRE CADRE',
                fontSize: 18,
                bold: true,
                color: 'white',
                margin: [0, 4],
              },
            ],
          ],
        },
      },

      {
        margin: [10, 5, 0, 0],
        alignment: 'center',
        fillColor: 'white',
        table: {
          widths: [15, 150, '*', '*', '*', 5, '*', '*'],
          body: [
            [
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              {
                text: 'PART SALARIALE',
                fontSize: 6,
                bold: true,
                colSpan: 3,
                border: [true, true, true, false],
              },
              '',
              {
                text: '',
                border: [true, false, true, false],
                fillColor: 'white',
              },
              {
                text: 'PART PATRONALE',
                fontSize: 6,
                bold: true,
                colSpan: 2,
                border: [true, true, true, false],
              },
              '',
            ],
          ],
        },
      },
      {
        margin: [10, 0, 0, 10],
        layout: {
          fillColor: (i, node) => {
            return i % 2 === 0 ? '#f5f5dc' : 'white';
          },
        },
        table: {
          widths: [15, 150, '*', '*', '*', 5, '*', '*'],
          headerRows: 1,
          body: [
            [
              { text: 'N°', style: 'header' },
              { text: 'Employes', style: 'header' },
              { text: 'Base', style: 'header' },
              { text: 'Taux', style: 'header' },
              { text: 'Montant', style: 'header' },
              {
                text: '',
                border: [true, false, true, false],
                fillColor: 'white',
              },
              { text: 'Taux', style: 'header' },
              { text: 'Montant', style: 'header' },
            ],
            ...IRCC.map((a, i) => {
              if (i === 0) {
                return [
                  { text: i + 1, style: 'header2' },
                  {
                    text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                    style: 'header2',
                    border: [true, true, true, false],
                  },
                  {
                    text: formatNumber(a.ligne.base) || '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: a.ligne.taux1 || '',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: formatNumber(a.ligne.montant),
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  {
                    text: a.ligne.taux2 || '',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: a.ligne.taux2
                      ? formatNumber(
                          Math.round((a.ligne.taux2 * a.ligne.base) / 100),
                        )
                      : '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                ];
              }
              return [
                { text: i + 1, style: 'header2' },
                {
                  text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                  style: 'header2',
                  border: [true, false, true, false],
                },
                {
                  text: formatNumber(a.ligne.base) || '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: a.ligne.taux1 || '',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: formatNumber(a.ligne.montant),
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                {
                  text: a.ligne.taux2 || '',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: a.ligne.taux2
                    ? formatNumber(
                        Math.round((a.ligne.taux2 * a.ligne.base) / 100),
                      )
                    : '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
              ];
            }),
            [
              {
                text: 'Total',
                colSpan: 4,
                bold: true,
                fillColor: 'white',
                fontSize: 6,
              },
              '',
              '',
              '',
              { text: formatNumber(t1), style: 'total' },
              { text: '', border: [true, false, true, false] },
              { text: formatNumber(t2) || '', style: 'total', colSpan: 2 },
              '',
            ],
          ],
        },
      },
      {
        margin: [30, 5],
        fillColor: 'black',
        alignment: 'center',
        layout: 'noBorders',
        pageBreak: 'after',
        table: {
          widths: [400],
          body: [
            [
              {
                text: `TOTAL IPRES REGIME COMPLEMENTAIRE CADRE: ${formatNumber(
                  t1 + t2,
                )} FCFA`,
                fontSize: 6,
                bold: true,
                color: 'white',
                margin: [0, 2],
              },
            ],
          ],
        },
      },
    ]);
    docDefinition.content.push([
      {
        columns: [
          {
            with: '20%',
            alignment: 'left',
            stack: [
              {
                text: 'REPUBLIQUE DU SENEGAL\n',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'Un Peuple, Un but, Une Foi\n',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                image: 'src/helpers/drapeau.jpg',
                width: 40,
                alignment: 'center',
              },
              {
                text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: 'SOCIALES DE ZIGUINCHOR',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            with: '20%',
            alignment: 'right',
            stack: [
              {
                image: 'src/helpers/logo.png',
                width: 100,
                margin: [10, 2],
              },
              {
                text: `Du ${format(
                  parse(lot.debut, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )} Au ${format(
                  parse(lot.fin, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )}`,
                fontSize: 6,
                bold: true,
              },
            ],
          },
        ],
      },
      {
        margin: [50, 10],
        fillColor: couleur,
        alignment: 'center',
        layout: 'noBorders',
        table: {
          widths: [400],
          body: [
            [
              {
                text: 'IPRES REGIME GENERAL',
                fontSize: 18,
                bold: true,
                color: 'white',
                margin: [0, 4],
              },
            ],
          ],
        },
      },

      {
        margin: [10, 5, 0, 0],
        alignment: 'center',
        fillColor: 'white',
        table: {
          widths: [15, 150, '*', '*', '*', 5, '*', '*'],
          body: [
            [
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              {
                text: 'PART SALARIALE',
                fontSize: 6,
                bold: true,
                colSpan: 2,
                border: [true, true, true, false],
              },
              '',
              {
                text: '',
                border: [true, false, true, false],
                fillColor: 'white',
              },
              {
                text: 'PART PATRONALE',
                fontSize: 6,
                bold: true,
                colSpan: 2,
                border: [true, true, true, false],
              },
              '',
            ],
          ],
        },
      },
      {
        margin: [10, 0, 0, 10],
        layout: {
          fillColor: (i, node) => {
            return i % 2 === 0 ? '#f5f5dc' : 'white';
          },
        },
        table: {
          widths: [15, 150, '*', '*', '*', 5, '*', '*'],
          headerRows: 1,
          body: [
            [
              { text: 'N°', style: 'header' },
              { text: 'Employes', style: 'header' },
              { text: 'Base', style: 'header' },
              { text: 'Taux', style: 'header' },
              { text: 'Montant', style: 'header' },
              {
                text: '',
                border: [true, false, true, false],
                fillColor: 'white',
              },
              { text: 'Taux', style: 'header' },
              { text: 'Montant', style: 'header' },
            ],
            ...IRG.map((a, i) => {
              if (i === 0) {
                return [
                  { text: i + 1, style: 'header2' },
                  {
                    text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                    style: 'header2',
                    border: [true, true, true, false],
                  },
                  {
                    text: formatNumber(a.ligne.base) || '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: a.ligne.taux1 || '',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: formatNumber(a.ligne.montant),
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  {
                    text: a.ligne.taux2 || '',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: a.ligne.taux2
                      ? formatNumber(
                          Math.round((a.ligne.taux2 * a.ligne.base) / 100),
                        )
                      : '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                ];
              }
              return [
                { text: i + 1, style: 'header2' },
                {
                  text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                  style: 'header2',
                  border: [true, false, true, false],
                },
                {
                  text: formatNumber(a.ligne.base) || '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: a.ligne.taux1 || '',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: formatNumber(a.ligne.montant),
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                {
                  text: a.ligne.taux2 || '',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: a.ligne.taux2
                    ? formatNumber(
                        Math.round((a.ligne.taux2 * a.ligne.base) / 100),
                      )
                    : '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
              ];
            }),
            [
              {
                text: 'Total',
                colSpan: 4,
                bold: true,
                fillColor: 'white',
                fontSize: 6,
              },
              '',
              '',
              '',
              { text: formatNumber(t3), style: 'total' },
              { text: '', border: [true, false, true, false] },
              { text: formatNumber(t4) || '', style: 'total', colSpan: 2 },
              '',
            ],
          ],
        },
      },
      {
        margin: [30, 5],
        fillColor: 'black',
        alignment: 'center',
        layout: 'noBorders',
        pageBreak: 'after',
        table: {
          widths: [400],
          body: [
            [
              {
                text: `TOTAL IPRES REGIME GENERAL: ${formatNumber(
                  t3 + t4,
                )} FCFA`,
                fontSize: 6,
                bold: true,
                color: 'white',
                margin: [0, 2],
              },
            ],
          ],
        },
      },
    ]);
    docDefinition.content.push([
      {
        columns: [
          {
            with: '20%',
            alignment: 'left',
            stack: [
              {
                text: 'REPUBLIQUE DU SENEGAL\n',  
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'Un Peuple, Un but, Une Foi\n',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                image: 'src/helpers/drapeau.jpg',
                width: 40,
                alignment: 'center',
              },
              {
                text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: 'SOCIALES DE ZIGUINCHOR',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            with: '20%',
            alignment: 'right',
            stack: [
              {
                image: 'src/helpers/logo.png',
                width: 100,
                margin: [10, 2],
              },
              {
                text: `Du ${format(
                  parse(lot.debut, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )} Au ${format(
                  parse(lot.fin, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )}`,
                fontSize: 6,
                bold: true,
              },
            ],
          },
        ],
      },
      {
        margin: [30, 15],
        fillColor: couleur,
        alignment: 'center',
        layout: 'noBorders',
        table: {
          widths: [400],
          body: [
            [
              {
                text: 'CAISSE DE SECURITE SOCIALE',
                fontSize: 18,
                bold: true,
                color: 'white',
                margin: [0, 4],
              },
            ],
          ],
        },
      },

      {
        margin: [10, 5, 0, 0],
        alignment: 'center',
        fillColor: 'white',
        table: {
          widths: [15, 150, '*', '*', '*', 5, '*', '*'],
          body: [
            [
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              {
                text: 'Accident du Travail',
                fontSize: 6,
                bold: true,
                colSpan: 2,
                border: [true, true, true, false],
              },
              '',
              {
                text: '',
                border: [true, false, true, false],
                fillColor: 'white',
              },
              {
                text: 'Allocations Familliales',
                fontSize: 6,
                bold: true,
                colSpan: 2,
                border: [true, true, true, false],
              },
              '',
            ],
          ],
        },
      },
      {
        margin: [10, 0, 0, 10],
        layout: {
          fillColor: (i, node) => {
            return i % 2 === 0 ? '#f5f5dc' : 'white';
          },
        },
        table: {
          widths: [15, 150, '*', '*', '*', 5, '*', '*'],
          headerRows: 1,
          body: [
            [
              { text: 'N°', style: 'header' },
              { text: 'Employes', style: 'header' },
              { text: 'Base', style: 'header' },
              { text: 'Taux', style: 'header' },
              { text: 'Montant', style: 'header' },
              {
                text: '',
                border: [true, false, true, false],
                fillColor: 'white',
              },
              { text: 'Taux', style: 'header' },
              { text: 'Montant', style: 'header' },
            ],
            ...CSS.map((a, i) => {
              if (i === 0) {
                return [
                  { text: i + 1, style: 'header2' },
                  {
                    text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                    style: 'header2',
                    border: [true, true, true, false],
                  },
                  {
                    text: formatNumber(a.at.base) || '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: '1',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: formatNumber(a.at.base / 100),
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  {
                    text: a.af.taux2 || '',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: a.af.taux2
                      ? formatNumber(Math.round((a.af.taux2 * a.af.base) / 100))
                      : '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                ];
              }
              return [
                { text: i + 1, style: 'header2' },
                {
                  text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                  style: 'header2',
                  border: [true, false, true, false],
                },
                {
                  text: formatNumber(a.at.base) || '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: '1',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: formatNumber(a.at.base / 100),
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                {
                  text: a.af.taux2 || '',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: a.af.taux2
                    ? formatNumber(Math.round((a.af.taux2 * a.af.base) / 100))
                    : '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
              ];
            }),
            [
              {
                text: 'Total',
                colSpan: 4,
                bold: true,
                fillColor: 'white',
                fontSize: 6,
              },
              '',
              '',
              '',
              { text: formatNumber(t5), style: 'total' },
              { text: '', border: [true, false, true, false] },
              { text: formatNumber(t6) || '', style: 'total', colSpan: 2 },
              '',
            ],
          ],
        },
      },
      {
        margin: [30, 5],
        fillColor: 'black',
        alignment: 'center',
        layout: 'noBorders',
        pageBreak: 'after',
        table: {
          widths: [400],
          body: [
            [
              {
                text: `TOTAL CAISSE DE SECURITE SOCIALE: ${formatNumber(
                  t5 + t6,
                )} FCFA`,
                fontSize: 6,
                bold: true,
                color: 'white',
                margin: [0, 2],
              },
            ],
          ],
        },
      },
    ]);

    docDefinition.content.push([
      {
        columns: [
          {
            with: '20%',
            alignment: 'left',
            stack: [
              {
                text: 'REPUBLIQUE DU SENEGAL\n',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'Un Peuple, Un but, Une Foi\n',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                image: 'src/helpers/drapeau.jpg',
                width: 40,
                alignment: 'center',
              },
              {
                text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: 'SOCIALES DE ZIGUINCHOR',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            with: '20%',
            alignment: 'right',
            stack: [
              {
                image: 'src/helpers/logo.png',
                width: 100,
                margin: [10, 2],
              },
              {
                text: `Du ${format(
                  parse(lot.debut, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )} Au ${format(
                  parse(lot.fin, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )}`,
                fontSize: 6,
                bold: true,
              },
            ],
          },
        ],
      },
      {
        margin: [30, 15],
        fillColor: couleur,
        alignment: 'center',
        layout: 'noBorders',
        table: {
          widths: [400],
          body: [
            [
              {
                text: 'IMPOT SUR LE REVENU',
                fontSize: 18,
                bold: true,
                color: 'white',
                margin: [0, 4],
              },
            ],
          ],
        },
      },

      {
        margin: [10, 5, 0, 0],
        alignment: 'center',
        fillColor: 'white',
        table: {
          widths: [15, 150, '*', '*', '*', '*'],
          body: [
            [
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              {
                text: 'ELEMENTS',
                fontSize: 6,
                bold: true,
                colSpan: 2,
                border: [true, true, true, false],
              },
              '',
              {
                text: 'MONTANT',
                fontSize: 6,
                bold: true,
                border: [true, true, true, true],
              },
            ],
          ],
        },
      },
      {
        margin: [10, 0, 0, 10],
        layout: {
          fillColor: (i, node) => {
            return i % 2 === 0 ? '#f5f5dc' : 'white';
          },
        },
        table: {
          widths: [15, 150, '*', '*', '*', '*'],
          headerRows: 1,
          body: [
            [
              { text: 'N°', style: 'header' },
              { text: 'Employes', style: 'header' },
              { text: 'Base', style: 'header' },
              { text: 'Impot', style: 'header' },
              { text: 'Trimf', style: 'header' },
              { text: 'Total', style: 'header' },
            ],
            ...IMPSR.map((a, i) => {
              if (i === 0) {
                return [
                  { text: i + 1, style: 'header2' },
                  {
                    text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                    style: 'header2',
                    border: [true, true, true, false],
                  },
                  {
                    text: formatNumber(a.imp.base) || '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: formatNumber(a?.imp?.montant) || '-',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: formatNumber(a.trf.montant),
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: formatNumber((a?.imp?.montant ?? 0) + a.trf.montant),
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                ];
              }
              return [
                { text: i + 1, style: 'header2' },
                {
                  text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                  style: 'header2',
                  border: [true, false, true, false],
                },
                {
                  text: formatNumber(a.imp.base) || '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: formatNumber(a?.imp?.montant) || '-',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: formatNumber(a.trf.montant),
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: formatNumber((a?.imp?.montant ?? 0) + a.trf.montant),
                  style: 'nombre',
                  border: [false, false, true, false],
                },
              ];
            }),
            [
              {
                text: 'Total',
                bold: true,
                fillColor: 'white',
                fontSize: 6,
                colSpan: 3,
              },
              '',
              '',
              { text: formatNumber(t7), style: 'total' },
              { text: formatNumber(t8) || '', style: 'total' },
              { text: formatNumber(ti) || '', style: 'total' },
            ],
          ],
        },
      },
      {
        margin: [30, 5],
        fillColor: 'black',
        alignment: 'center',
        layout: 'noBorders',
        pageBreak: 'after',
        table: {
          widths: [400],
          body: [
            [
              {
                text: `TOTAL IMPOT SUR LE REVENU: ${formatNumber(
                  t7 + t8,
                )} FCFA`,
                fontSize: 6,
                bold: true,
                color: 'white',
                margin: [0, 2],
              },
            ],
          ],
        },
      },
    ]);
    docDefinition.content.push([
      {
        columns: [
          {
            with: '20%',
            alignment: 'left',
            stack: [
              {
                text: 'REPUBLIQUE DU SENEGAL\n',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'Un Peuple, Un but, Une Foi\n',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                image: 'src/helpers/drapeau.jpg',
                width: 40,
                alignment: 'center',
              },
              {
                text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: "DE LA RECHERCHE ET DE L'INNOVATION\n",
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
              {
                text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                fontSize: 6,
                bold: true,
                margin: [0, 2],
                alignment: 'center',
              },
              {
                text: 'SOCIALES DE ZIGUINCHOR',
                fontSize: 6,
                bold: true,
                alignment: 'center',
              },
            ],
          },
          {
            with: '20%',
            alignment: 'right',
            stack: [
              {
                image: 'src/helpers/logo.png',
                width: 100,
                margin: [10, 2],
              },
              {
                text: `Du ${format(
                  parse(lot.debut, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )} Au ${format(
                  parse(lot.fin, 'yyyy-MM-dd', new Date()),
                  'dd MMMM yyyy',
                  { locale: fr },
                )}`,
                fontSize: 6,
                bold: true,
              },
            ],
          },
        ],
      },
      {
        margin: [30, 15],
        fillColor: couleur,
        alignment: 'center',
        layout: 'noBorders',
        table: {
          widths: [400],
          body: [
            [
              {
                text: 'FOND NATIONAL DE RETRAITE',
                fontSize: 18,
                bold: true,
                color: 'white',
                margin: [0, 4],
              },
            ],
          ],
        },
      },

      {
        margin: [10, 5, 0, 0],
        alignment: 'center',
        fillColor: 'white',
        table: {
          widths: [15, 150, '*', '*', '*', 5, '*', '*'],
          body: [
            [
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              { text: '', border: [false, false, false, false] },
              {
                text: 'PART SALARIALE',
                fontSize: 6,
                bold: true,
                colSpan: 2,
                border: [true, true, true, false],
              },
              '',
              {
                text: '',
                border: [true, false, true, false],
                fillColor: 'white',
              },
              {
                text: 'PART PATRONALE',
                fontSize: 6,
                bold: true,
                colSpan: 2,
                border: [true, true, true, false],
              },
              '',
            ],
          ],
        },
      },
      {
        margin: [10, 0, 0, 10],
        layout: {
          fillColor: (i, node) => {
            return i % 2 === 0 ? '#f5f5dc' : 'white';
          },
        },
        table: {
          widths: [15, 150, '*', '*', '*', 5, '*', '*'],
          headerRows: 1,
          body: [
            [
              { text: 'N°', style: 'header' },
              { text: 'Employes', style: 'header' },
              { text: 'Base', style: 'header' },
              { text: 'Taux', style: 'header' },
              { text: 'Montant', style: 'header' },
              {
                text: '',
                border: [true, false, true, false],
                fillColor: 'white',
              },
              { text: 'Taux', style: 'header' },
              { text: 'Montant', style: 'header' },
            ],
            ...FNR.map((a, i) => {
              if (i === 0) {
                return [
                  { text: i + 1, style: 'header2' },
                  {
                    text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                    style: 'header2',
                    border: [true, true, true, false],
                  },
                  {
                    text: formatNumber(a.ligne.base) || '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: a.ligne.taux1 || '',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: formatNumber(a.ligne.montant),
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                  {
                    text: '',
                    border: [true, false, true, false],
                    fillColor: 'white',
                  },
                  {
                    text: a.ligne.taux2 || '',
                    style: 'header2',
                    border: [false, true, true, false],
                  },
                  {
                    text: a.ligne.taux2
                      ? formatNumber(
                          Math.round((a.ligne.taux2 * a.ligne.base) / 100),
                        )
                      : '',
                    style: 'nombre',
                    border: [false, true, true, false],
                  },
                ];
              }
              return [
                { text: i + 1, style: 'header2' },
                {
                  text: `${a['contrat_actif']?.matricule_de_solde || 'N/A'}|${a.employe.prenom} ${a.employe.nom}`,
                  style: 'header2',
                  border: [true, false, true, false],
                },
                {
                  text: formatNumber(a.ligne.base) || '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: a.ligne.taux1 || '',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: formatNumber(a.ligne.montant),
                  style: 'nombre',
                  border: [false, false, true, false],
                },
                {
                  text: '',
                  border: [true, false, true, false],
                  fillColor: 'white',
                },
                {
                  text: a.ligne.taux2 || '',
                  style: 'header2',
                  border: [false, false, true, false],
                },
                {
                  text: a.ligne.taux2
                    ? formatNumber(
                        Math.round((a.ligne.taux2 * a.ligne.base) / 100),
                      )
                    : '',
                  style: 'nombre',
                  border: [false, false, true, false],
                },
              ];
            }),
            [
              {
                text: 'Total',
                colSpan: 4,
                bold: true,
                fillColor: 'white',
                fontSize: 6,
              },
              '',
              '',
              '',
              { text: formatNumber(t9), style: 'total' },
              { text: '', border: [true, false, true, false] },
              { text: formatNumber(t10) || '', style: 'total', colSpan: 2 },
              '',
            ],
          ],
        },
      },
      {
        margin: [30, 5],
        fillColor: 'black',
        alignment: 'center',
        layout: 'noBorders',
        pageBreak: 'after',
        table: {
          widths: [400],
          body: [
            [
              {
                text: `TOTAL FONDS NATIONAL RETRAITE: ${formatNumber(
                  t9 + t10,
                )} FCFA`,
                fontSize: 6,
                bold: true,
                color: 'white',
                margin: [0, 2],
              },
            ],
          ],
        },
      },
    ]);
    const options = {};
    const pdfDoc = PdfPrinter.createPdf(docDefinition as any, options);
    const key = `bulletins/${_id.toString()}-${mois}-${annee}.pdf`;
    return this.uploadPdf(pdfDoc, key);
  }

  async makeAllCdd(bulletins: any[], lot: any, couleur = '#fac66b') {
    const { mois, annee, etat, _id, debut, fin } = lot;
    const wm = etat === 'VALIDE' ? annee : 'BROUILLON';
    // Calcul du total NAP
    const totalNap = bulletins.reduce((acc, b) => acc + (b.nap || 0), 0);

    const docDefinition = {
      footer: function () {
        return {
          text: 'DANS VOTRE INTERET ET POUR VOUS AIDER A FAIRE VALOIR VOS DROITS, CONSERVER CE DOCUMENT SANS LIMITATION DE DUREE',
          fontSize: 6,
          alignment: 'center' as const,
          italics: true,
        };
      },
      watermark: {
        text: `Bulletin CDD CROUS/Z ${wm}`,
        color: etat === 'VALIDE' ? 'grey' : 'red',
        opacity: 0.1,
        bold: true,
      },
      content: [
        {
          columns: [
            {
              width: '50%',
              alignment: 'left',
              stack: [
                {
                  text: 'REPUBLIQUE DU SENEGAL\n',
                  fontSize: 8,
                  bold: true,
                  alignment: 'center',
                },
                {
                  text: 'Un Peuple, Un but, Une Foi\n',
                  fontSize: 8,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  image: 'src/helpers/drapeau.jpg',
                  width: 50,
                  alignment: 'center',
                },
                {
                  text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                  fontSize: 8,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                  fontSize: 8,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  text: 'SOCIALES DE ZIGUINCHOR',
                  fontSize: 8,
                  bold: true,
                  alignment: 'center',
                },
              ],
            },
            {
              width: '50%',
              alignment: 'right',
              stack: [
                {
                  image: 'src/helpers/logo.png',
                  width: 80,
                  margin: [10, 2],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },
         {
              width: '60%',
              alignment: 'center',
              stack: [
                {
                  text: 'TABLEAU DES BULLETINS DE PAIE - CDD',
                  fontSize: 14,
                  bold: true,
                  margin: [0, 20],
                },
                {
                  text: `Période: ${format(parse(debut, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: fr })} au ${format(parse(fin, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: fr })}`,
                  fontSize: 10,
                  bold: true,
                },
              ],
            },
        {
          margin: [2, 10, 0, 10],
          layout: {
            fillColor: (i: number) => {
              return i % 2 === 0 ? '#f5f5dc' : 'white';
            },
          },
          table: {
            widths: [30, 80, '*', '*', 80],
            headerRows: 1,
            body: [
              [
                { text: 'N°', style: 'header3' },
                { text: 'Nom', style: 'header3' },
                { text: 'Prénom', style: 'header3' },
                { text: 'Poste', style: 'header3' },
                { text: 'Net à Payer', style: 'header3' },
              ],
              ...bulletins
                .sort((a, b) => {
                  const nomA = (a.employe?.nom || '').toLowerCase();
                  const nomB = (b.employe?.nom || '').toLowerCase();
                  return nomA.localeCompare(nomB);
                })
                .map((b, i) => [
                  { text: i + 1, style: 'header2' },
                  { text: b.employe?.nom || '', style: 'header2' },
                  { text: b.employe?.prenom || '', style: 'header2' },
                  { text: b.contrat_actif.poste.nom, style: 'header2' },
                  { text: formatNumber(b.nap || 0), style: 'nombre' },
                ]),
              [
                { text: 'TOTAL', bold: true, colSpan: 4, fillColor: couleur },
                '',
                '',
                '',
                { text: formatNumber(totalNap), bold: true, style: 'nombre' },
              ],
            ],
          },
        },
        {
          margin: [0, 20],
          text: `Nombre total d'agents CDD: ${bulletins.length}`,
          fontSize: 10,
          bold: true,
        },
      ],
      styles: {
        header: {
          border: [true, true, true, true],
          fillColor: couleur,
          bold: true,
          alignment: 'center',
          fontSize: 8,
          lineHeight: 0.8,
        },
        header2: {
          alignment: 'left',
          fontSize: 8,
          lineHeight: 0.8,
        },
        nombre: {
          alignment: 'right',
          fontSize: 8,
          bold: true,
        },
        header3: {
          fillColor: couleur,
          bold: true,
          alignment: 'center',
          fontSize: 8,
        },
      },
    };

    const pdfDoc = PdfPrinter.createPdf(docDefinition as any);
    const key = `bulletins/cdd/${_id.toString()}-${mois}-${annee}-all.pdf`;
    return await this.uploadPdf(pdfDoc, key);
  }

  async makeAllTemporaire(bulletins: any[], lot: any, couleur = '#fac66b') {
    const { mois, annee, etat, _id, debut, fin } = lot;
    const wm = etat === 'VALIDE' ? annee : 'BROUILLON';

    // Calcul du total NAP
    const totalNap = bulletins.reduce((acc, b) => acc + (b.nap || 0), 0);

    const docDefinition = {
      footer: function () {
        return {
          text: 'DANS VOTRE INTERET ET POUR VOUS AIDER A FAIRE VALOIR VOS DROITS, CONSERVER CE DOCUMENT SANS LIMITATION DE DUREE',
          fontSize: 6,
          alignment: 'center' as const,
          italics: true,
        };
      },
      watermark: {
        text: `Bulletin TEMPORAIRE CROUS/Z ${wm}`,
        color: etat === 'VALIDE' ? 'grey' : 'red',
        opacity: 0.1,
        bold: true,
      },
      content: [
        {
          columns: [
            {
              width: '50%',
              alignment: 'left',
              stack: [
                {
                  text: 'REPUBLIQUE DU SENEGAL\n',
                  fontSize: 8,
                  bold: true,
                  alignment: 'center',
                },
                {
                  text: 'Un Peuple, Un but, Une Foi\n',
                  fontSize: 8,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  image: 'src/helpers/drapeau.jpg',
                  width: 50,
                  alignment: 'center',
                },
                {
                  text: "MINISTERE DE L'ENSEIGNEMENT SUPERIEUR\n",
                  fontSize: 8,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  text: 'CENTRE REGIONAL DES OEUVRES UNIVERSITAIRES',
                  fontSize: 8,
                  bold: true,
                  margin: [0, 2],
                  alignment: 'center',
                },
                {
                  text: 'SOCIALES DE ZIGUINCHOR',
                  fontSize: 8,
                  bold: true,
                  alignment: 'center',
                },
              ],
            },
            {
              width: '50%',
              alignment: 'right',
              stack: [
                {
                  image: 'src/helpers/logo.png',
                  width: 80,
                  margin: [10, 2],
                },
              ],
            },
          ],
          margin: [0, 0, 0, 20],
        },
         {
              width: '60%',
              alignment: 'center',
              stack: [
                {
                  text: 'TABLEAU DES BULLETINS DE PAIE - TEMPORAIRE',
                  fontSize: 14,
                  bold: true,
                  margin: [0, 20],
                },
                {
                  text: `Période: ${format(parse(debut, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: fr })} au ${format(parse(fin, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: fr })}`,
                  fontSize: 10,
                  bold: true,
                },
              ],
            },
        {
          margin: [2, 10, 0, 10],
          layout: {
            fillColor: (i: number) => {
              return i % 2 === 0 ? '#f5f5dc' : 'white';
            },
          },
          table: {
            widths: [30, 60, '*', '*', 90],
            headerRows: 1,
            body: [
              [
                { text: 'N°', style: 'header3' },
                { text: 'Nom', style: 'header3' },
                { text: 'Prénom', style: 'header3' },
                { text: 'Poste', style: 'header3' },
                { text: 'Net à Payer', style: 'header3' },
              ],
              ...bulletins
                .sort((a, b) => {
                  const nomA = (a.employe?.nom || '').toLowerCase();
                  const nomB = (b.employe?.nom || '').toLowerCase();
                  return nomA.localeCompare(nomB);
                })
                .map((b, i) => [
                  { text: i + 1, style: 'header2' },
                  { text: b.employe?.nom || '', style: 'header2' },
                  { text: b.employe?.prenom || '', style: 'header2' },
                  { text: b['contrat_actif']?.poste?.nom || 'N/A', style: 'header2' },
                  { text: formatNumber(b.nap || 0), style: 'nombre' },
                ]),
              [
                { text: 'TOTAL', bold: true, colSpan: 4, fillColor: couleur },
                '',
                '',
                '',
                { text: formatNumber(totalNap), bold: true, style: 'nombre' },
              ],
            ],
          },
        },
        {
          margin: [0, 20],
          text: 'Tableau trié par Poste',
          fontSize: 12,
          bold: true,
          alignment: 'center',
        },
        {
          margin: [2, 10, 0, 10],
          layout: {
            fillColor: (i: number) => {
              return i % 2 === 0 ? '#f5f5dc' : 'white';
            },
          },
          table: {
            widths: [30, '*', '*', '*', 120],
            headerRows: 1,
            body: [
              [
                { text: 'N°', style: 'header3' },
                { text: 'Poste', style: 'header3' },
                { text: 'Nom', style: 'header3' },
                { text: 'Prénom', style: 'header3' },
                { text: 'Net à Payer', style: 'header3' },
              ],
              ...bulletins
                .sort((a, b) => {
                  const posteA = (a['contrat_actif']?.poste?.nom || '').toLowerCase();
                  const posteB = (b['contrat_actif']?.poste?.nom || '').toLowerCase();
                  return posteA.localeCompare(posteB);
                })
                .map((b, i) => [
                  { text: i + 1, style: 'header2' },
                  { text: b['contrat_actif']?.poste?.nom || 'N/A', style: 'header2' },
                  { text: b.employe?.nom || '', style: 'header2' },
                  { text: b.employe?.prenom || '', style: 'header2' },
                  { text: formatNumber(b.nap || 0), style: 'nombre' },
                ]),
              [
                { text: 'TOTAL', bold: true, colSpan: 4, fillColor: couleur },
                '',
                '',
                '',
                { text: formatNumber(totalNap), bold: true, style: 'nombre' },
              ],
            ],
          },
        },
        {
          margin: [0, 20],
          text: `Nombre total d'agents TEMPORAIRE: ${bulletins.length}`,
          fontSize: 10,
          bold: true,
        },
      ],
      styles: {
        header: {
          border: [true, true, true, true],
          fillColor: couleur,
          bold: true,
          alignment: 'center',
          fontSize: 8,
          lineHeight: 0.8,
        },
        header2: {
          alignment: 'left',
          fontSize: 8,
          lineHeight: 0.8,
        },
        nombre: {
          alignment: 'right',
          fontSize: 8,
          bold: true,
        },
        header3: {
          fillColor: couleur,
          bold: true,
          alignment: 'center',
          fontSize: 8,
        },
      },
    };

    const pdfDoc = PdfPrinter.createPdf(docDefinition as any);
    const key = `bulletins/temporaires/${_id.toString()}-${mois}-${annee}-all.pdf`;
    return await this.uploadPdf(pdfDoc, key);
  }
}
