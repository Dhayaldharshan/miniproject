package com.crisissync.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String frontendDir = Paths.get("frontend").toAbsolutePath().toUri().toString();
        if (!frontendDir.endsWith("/")) {
            frontendDir += "/";
        }
        String rootDir = Paths.get(".").toAbsolutePath().toUri().toString();
        if (!rootDir.endsWith("/")) {
            rootDir += "/";
        }

        registry.addResourceHandler("/**")
                .addResourceLocations(
                        frontendDir,
                        rootDir,
                        "classpath:/static/",
                        "classpath:/public/"
                );

        registry.addResourceHandler("/frontend/**")
                .addResourceLocations(frontendDir);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
