const fs = require('fs');

let code = fs.readFileSync('frontend/app.js', 'utf8');

const target = `            const healthy = await ResqApi.checkHealth();
            console.log("[DEBUG-TRACE] checkBackendConnection: ResqApi.checkHealth returned", healthy);
            if (healthy) {
                if (elements.statusDot) elements.statusDot.classList.remove('offline');
                if (elements.connectionStatus) elements.connectionStatus.textContent = 'API Connected (8080)';
                if (elements.offlineBanner) elements.offlineBanner.style.display = 'none';
                return true;
            }
        } catch (err) {
            // Handled below
        }`;

const repl = `            const healthy = await ResqApi.checkHealth();
            console.log("[DEBUG-TRACE] checkBackendConnection: ResqApi.checkHealth returned", healthy);
            if (healthy) {
                console.log("[DEBUG-TRACE] checking elements:", {
                    statusDot: !!elements.statusDot,
                    connectionStatus: !!elements.connectionStatus,
                    offlineBanner: !!elements.offlineBanner
                });
                if (elements.statusDot) elements.statusDot.classList.remove('offline');
                if (elements.connectionStatus) elements.connectionStatus.textContent = 'API Connected (8080)';
                if (elements.offlineBanner) elements.offlineBanner.style.display = 'none';
                console.log("[DEBUG-TRACE] checkBackendConnection: RETURNING TRUE");
                return true;
            }
        } catch (err) {
            console.error("[DEBUG-TRACE] checkBackendConnection CAUGHT ERROR:", err.message, err.stack);
        }`;

code = code.replace(target, repl);
fs.writeFileSync('frontend/app.js', code, 'utf8');
fs.writeFileSync('app.js', code, 'utf8');
console.log('Added catch error logging.');

