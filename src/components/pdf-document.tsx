import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Konversi cm → pt (1cm = 28.3465pt)
// Margin akademik per PRD: Kiri 4cm, Atas 3cm, Kanan 3cm, Bawah 3cm
const CM = 28.3465;
const MARGIN = {
  left: 4 * CM,   // 113.39pt
  top: 3 * CM,    // 85.04pt
  right: 3 * CM,  // 85.04pt
  bottom: 3 * CM, // 85.04pt
};

// Times-Roman adalah standard PDF font (built-in), tidak perlu register.
const styles = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 12,
    paddingTop: MARGIN.top,
    paddingBottom: MARGIN.bottom,
    paddingLeft: MARGIN.left,
    paddingRight: MARGIN.right,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 1.4,
  },
  bodyText: {
    fontSize: 12,
    textAlign: "justify",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  bibliographyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 16,
    textTransform: "uppercase",
  },
  bibliographyItem: {
    fontSize: 12,
    textAlign: "justify",
    marginBottom: 8,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: MARGIN.left,
    right: MARGIN.right,
    borderTopWidth: 0.5,
    borderTopColor: "#bbbbbb",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerCredit: {
    fontSize: 8,
    color: "grey",
  },
  footerPage: {
    fontSize: 9,
    color: "grey",
  },
});

interface PdfDocumentProps {
  landasanTeori: string;
  daftarPustaka: string[];
  judulAnalisis?: string;
}

export function PdfDocument({
  landasanTeori,
  daftarPustaka,
  judulAnalisis,
}: PdfDocumentProps) {
  const paragraphs = landasanTeori
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Document title={judulAnalisis || "Landasan Teori"} author="LandasanTeori Generator (@athaar.mp)">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>LANDASAN TEORI</Text>
        {judulAnalisis ? <Text style={styles.subtitle}>{judulAnalisis}</Text> : null}
        <View>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.bodyText}>
              {paragraph}
            </Text>
          ))}
        </View>

        <Text
          style={styles.bibliographyTitle}
          break={daftarPustaka.length > 5}
        >
          DAFTAR PUSTAKA
        </Text>

        <View>
          {daftarPustaka.map((ref, index) => (
            <Text key={index} style={styles.bibliographyItem}>
              [{index + 1}] {ref.replace(/\*/g, "")}
            </Text>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerCredit}>
            LandasanTeori Generator — oleh Athar | @athaar.mp (Instagram)
          </Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} dari ${totalPages}`
            }
            fixed
          />
        </View>
      </Page>
    </Document>
  );
}
