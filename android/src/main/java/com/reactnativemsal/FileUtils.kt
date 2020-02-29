package com.reactnativemsal

import java.io.*

/**
 * Code copied from org.apache.commons.io/FileUtils.java and org.apache.commons.io/IOUtils.java, v2.6
 * and converted to Kotlin via Android Studio tools.
 */
object FileUtils {
  private const val DEFAULT_BUFFER_SIZE = 1024 * 4
  const val EOF = -1

  @Throws(IOException::class)
  fun copyInputStreamToFile(source: InputStream, destination: File) {
    source.use { `in` -> copyToFile(`in`, destination) }
  }

  @Throws(IOException::class)
  fun copyToFile(source: InputStream, destination: File) {
    source.use { `in` -> openOutputStream(destination).use { out -> copy(`in`, out) } }
  }

  @JvmOverloads
  @Throws(IOException::class)
  fun openOutputStream(file: File, append: Boolean = false): FileOutputStream {
    if (file.exists()) {
      if (file.isDirectory) {
        throw IOException("File '$file' exists but is a directory")
      }
      if (!file.canWrite()) {
        throw IOException("File '$file' cannot be written to")
      }
    } else {
      val parent = file.parentFile
      if (parent != null) {
        if (!parent.mkdirs() && !parent.isDirectory) {
          throw IOException("Directory '$parent' could not be created")
        }
      }
    }
    return FileOutputStream(file, append)
  }

  @Throws(IOException::class)
  fun copy(input: InputStream, output: OutputStream): Int {
    val count = copyLarge(input, output)
    return if (count > Int.MAX_VALUE) {
      -1
    } else count.toInt()
  }

  @Throws(IOException::class)
  fun copyLarge(input: InputStream, output: OutputStream): Long {
    return copy(input, output, DEFAULT_BUFFER_SIZE)
  }

  @Throws(IOException::class)
  fun copy(input: InputStream, output: OutputStream, bufferSize: Int): Long {
    return copyLarge(input, output, ByteArray(bufferSize))
  }

  @Throws(IOException::class)
  fun copyLarge(input: InputStream, output: OutputStream, buffer: ByteArray?): Long {
    var count: Long = 0
    var n: Int
    while (EOF != input.read(buffer).also { n = it }) {
      output.write(buffer, 0, n)
      count += n.toLong()
    }
    return count
  }
}
