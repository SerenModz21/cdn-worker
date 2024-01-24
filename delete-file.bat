@echo off

for %%x in (%*) do (
    curl -sX DELETE -H "Access-Token: %CDN_ACCESS_TOKEN%" %%x
    echo:
)

pause
