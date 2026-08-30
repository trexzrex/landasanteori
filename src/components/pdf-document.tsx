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
    marginBottom: 24,
    textTransform: "uppercase",
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
  pageNumber: {
    position: "absolute",
    fontSize: 10,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
  },
});

interface PdfDocumentProps {
  landasanTeori: string;
  daftarPustaka: string[];
}

export function PdfDocument({
  landasanTeori,
  daftarPustaka,
}: PdfDocumentProps) {
  const paragraphs = landasanTeori
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>LANDASAN TEORI</Text>

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

        <Text
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
