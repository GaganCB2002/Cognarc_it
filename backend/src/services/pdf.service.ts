import pdfParse from 'pdf-parse';
import fs from 'fs';

const parsePdf = (pdfParse as any).default || pdfParse;

export const extractTextFromPdfBuffer = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await parsePdf(buffer);
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Failed to parse PDF document");
  }
};

export const extractTextFromPdfPath = async (filePath: string): Promise<string> => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    return await extractTextFromPdfBuffer(dataBuffer);
  } catch (error) {
    console.error("Error reading PDF file:", error);
    throw new Error("Failed to read PDF document");
  }
};
