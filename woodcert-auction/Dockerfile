# syntax=docker/dockerfile:1

FROM maven:3.9.9-eclipse-temurin-17-alpine AS build
WORKDIR /workspace

COPY pom.xml ./
RUN mvn -B -ntp dependency:go-offline

COPY src ./src
RUN mvn -B -ntp -Dmaven.test.skip=true package

FROM eclipse-temurin:17-jre-alpine
RUN apk update && apk upgrade --no-cache \
    && addgroup -S woodcert \
    && adduser -S -G woodcert woodcert

WORKDIR /app
COPY --from=build /workspace/target/*.jar /app/app.jar

USER woodcert
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
