@echo off
echo Cleaning previous build...
if exist dist rmdir /s /q dist

echo Building React App...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo.
echo Syncing to S3...
aws s3 sync dist s3://intellpharma.frontend --delete
if %ERRORLEVEL% NEQ 0 (
    echo S3 Sync failed! Ensure AWS CLI is installed and configured.
    exit /b %ERRORLEVEL%
)

echo.
echo Configuring Website Hosting (Fixing 404 errors)...
aws s3 website s3://intellpharma.frontend --index-document index.html --error-document index.html
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Could not configure website hosting automatically.
    echo Please ensure you manually set 'Error document' to 'index.html' in S3 Console.
)

echo.
echo Deployment Complete!
echo Visit your site endpoint.
pause
