package com.reactnativemsal;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/**
 * Code copied from org.apache.commons.io/FileUtils.java and org.apache.commons.io/IOUtils.java,
 * v2.8
 */
public class FileUtils {
    public static final int DEFAULT_BUFFER_SIZE = 8192;
    public static final int EOF = -1;

    public static void copyInputStreamToFile(InputStream source, File destination)
            throws IOException {
        try (InputStream inputStream = source) {
            copyToFile(inputStream, destination);
        }
    }

    public static void copyToFile(InputStream inputStream, File file) throws IOException {
        try (OutputStream out = openOutputStream(file, false)) {
            copy(inputStream, out);
        }
    }

    public static FileOutputStream openOutputStream(File file, boolean append) throws IOException {
        if (file == null) {
            throw new IOException("File cannot be null.");
        }
        if (file.exists()) {
            if (!file.isFile()) {
                throw new IOException("Not a file: " + file);
            }
            if (!file.canWrite()) {
                throw new IOException("File is not writable: '" + file + "'");
            }
        } else {
            File parent = file.getParentFile();
            if (parent != null) {
                if (!parent.mkdirs() && !parent.isDirectory()) {
                    throw new IOException("Cannot create directory '" + parent + "'.");
                }
            }
        }
        return new FileOutputStream(file, append);
    }

    public static int copy(InputStream inputStream, OutputStream outputStream) throws IOException {
        long count = copyLarge(inputStream, outputStream);
        if (count > Integer.MAX_VALUE) {
            return EOF;
        }
        return (int) count;
    }

    public static long copyLarge(InputStream inputStream, OutputStream outputStream)
            throws IOException {
        return copy(inputStream, outputStream, DEFAULT_BUFFER_SIZE);
    }

    public static long copy(InputStream inputStream, OutputStream outputStream, int bufferSize)
            throws IOException {
        return copyLarge(inputStream, outputStream, new byte[bufferSize]);
    }

    public static long copyLarge(InputStream inputStream, OutputStream outputStream, byte[] buffer)
            throws IOException {
        long count = 0;
        int n;
        while (EOF != (n = inputStream.read(buffer))) {
            outputStream.write(buffer, 0, n);
            count += n;
        }
        return count;
    }
}
