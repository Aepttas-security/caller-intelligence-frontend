@echo off
set GRADLE_USER_HOME=D:\gradle_cache
set ANDROID_USER_HOME=D:\android_cache
cd android
call gradlew.bat clean
call gradlew.bat assembleDebug -Duser.home=D:\android_cache --no-daemon
