import ch.qos.logback.classic.encoder.PatternLayoutEncoder
import ch.qos.logback.core.ConsoleAppender
import jdk.nashorn.internal.runtime.Debug

scan()

appender("CONSOLE", ConsoleAppender) {
    encoder(PatternLayoutEncoder) {
        //pattern = "| %-5level| %d{HH:mm:ss.SSS} | %logger{36} - %msg%n"
        pattern = "| %-5level| %d{HH:mm:ss.SSS} | %logger - %msg%n"
    }
}

logger("org.oasis_eu.portal.main", INFO)
logger("org.oasis_eu", INFO)
//logger("org.oasis_eu.portal.services", DEBUG)
//logger("org.oasis_eu.portal.core.dao", DEBUG)
logger("org.oasis_eu.portal.config.OasisLocaleResolver", INFO)
//logger("org.oasis_eu.spring.kernel.security", DEBUG)
//logger("org.oasis_eu.spring.util.KernelLoggingInterceptor", DEBUG)
//logger("kernelLogging.logFullErrorResponses", DEBUG)
//logger("kernelLogging.logRequestTimings", DEBUG)
//logger("org.apache.http.wire", DEBUG)

logger("org.oasis_eu.portal.core.services.icons", DEBUG)
logger("org.oasis_eu.portal.front.my", DEBUG)

root(WARN, ["CONSOLE"])
