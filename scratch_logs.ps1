$gcloud = [System.IO.Path]::Combine([System.Environment]::GetFolderPath('LocalApplicationData'), 'Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd')
& $gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=crdms-backend" --limit=30 --format="value(textPayload)"
