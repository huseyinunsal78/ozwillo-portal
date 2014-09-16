package org.oasis_eu.portal.core.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.joda.JodaModule;
import com.fasterxml.jackson.datatype.jsr310.JSR310Module;
import net.sf.ehcache.config.CacheConfiguration;
import org.oasis_eu.portal.core.PortalCorePackage;
import org.oasis_eu.portal.core.internal.PortalCacheManager;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.ehcache.EhCacheCacheManager;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.cache.interceptor.SimpleKeyGenerator;
import org.springframework.cache.support.CompositeCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

/**
 * User: schambon
 * Date: 5/30/14
 */
@Configuration
@ComponentScan(basePackageClasses = PortalCorePackage.class)
@EnableCaching
public class PortalCoreConfiguration implements CachingConfigurer {


    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JodaModule());
        mapper.registerModule(new JSR310Module());
        return mapper;
    }

    @Bean
    public PortalCacheManager portalCacheManager() {
        return new PortalCacheManager(
                Arrays.asList("appstore", "subscriptions", "user-instances", "org-instances", "user-memberships", "org-memberships", "services", "services-of-instance", "instances"));
    }


    @Bean(destroyMethod = "shutdown")
    public net.sf.ehcache.CacheManager ehCacheManager() {
        // TODO configure the various elements (TTL, max entries...) possibly, also configure a different cache by entity
        CacheConfiguration defaultCache = new CacheConfiguration();
        defaultCache.setMemoryStoreEvictionPolicy("LRU");
        defaultCache.setMaxEntriesLocalHeap(1000);
        defaultCache.setTimeToLiveSeconds(600);

        CacheConfiguration organizationsCache = new CacheConfiguration("organizations", 1000);
        CacheConfiguration applicationsCache = new CacheConfiguration("applications", 1000);

        net.sf.ehcache.config.Configuration config = new net.sf.ehcache.config.Configuration();
        config.addDefaultCache(defaultCache);
        config.addCache(organizationsCache);
        config.addCache(applicationsCache);

        return net.sf.ehcache.CacheManager.newInstance(config);
    }

    @Bean
    public CacheManager longTermCacheManager() {
        EhCacheCacheManager ehCacheCacheManager = new EhCacheCacheManager(ehCacheManager());
        return ehCacheCacheManager;
    }

    @Bean
    public CacheManager cacheManager() {
        CompositeCacheManager compositeCacheManager = new CompositeCacheManager();

        compositeCacheManager.setCacheManagers(Arrays.asList(
                portalCacheManager(),
                longTermCacheManager()));
        return compositeCacheManager;
    }


    @Override
    public KeyGenerator keyGenerator() {
        return new SimpleKeyGenerator();
    }
}
