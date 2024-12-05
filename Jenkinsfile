pipeline {
    agent any
    tools {
        dockerTool 'docker'
    }
    environment {
        IMAGENAME = 'blockscout-v2' // Set the image name as an environment variable
    }
    parameters {
        choice(name: 'BUILD_TYPE', choices: ['patch', 'minor', 'major'], description: 'Select version to build in develop')
        choice(name: 'NET', choices: ['stagenet', 'testnet', 'mainnet'], description: 'Select net type to build')
        choice(name: 'CLOUD', choices: ['AZURE', 'GCP', 'AWS'], description: 'Select cloud operator to push docker image')
    }
    stages {
        stage('GCP Release') {
            when {
                expression { return params.CLOUD == 'GCP' }
            }
            environment {
                INCREMENT_TYPE = "${params.BUILD_TYPE}"
                TAG = "${params.NET}"
                GCR = "asia-south1-docker.pkg.dev/prod-dojima/${params.NET}"
            }
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'dojimanetwork', keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'gcloud-access-token', variable: 'GCLOUD_ACCESS_TOKEN'),
                    string(credentialsId: 'ci-registry-user', variable: 'CI_REGISTRY_USER'),
                    string(credentialsId: 'ci-registry', variable: 'CI_REGISTRY'),
                    string(credentialsId: 'ci-pat', variable: 'CR_PAT')]) {
                        // Set the SSH key for authentication
                        withEnv(["GIT_SSH_COMMAND=ssh -o StrictHostKeyChecking=no -i ${env.SSH_KEY}"]) {
                            echo "Selected action: $INCREMENT_TYPE, $TAG, $GCR"
                            sh 'gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin --password-stdin https://$GCR'
                            sh 'make release'
                        }
                    }
                }
            }
        }

        stage('AZURE Release') {
            when {
                expression { return params.CLOUD == 'AZURE' }
            }
            environment {
                INCREMENT_TYPE = "${params.BUILD_TYPE}"
            }
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'dojimanetwork', keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'azure-stagenet-cr-token', variable: 'AZURE_STAGENET_ACCESS_TOKEN'),
                    string(credentialsId: 'azure-mainnet-cr-token', variable: 'AZURE_MAINNET_ACCESS_TOKEN'),
                    string(credentialsId: 'azure-testnet-cr-token', variable: 'AZURE_TESTNET_ACCESS_TOKEN'),
                    string(credentialsId: 'ci-registry-user', variable: 'CI_REGISTRY_USER'),
                    string(credentialsId: 'ci-registry', variable: 'CI_REGISTRY'),
                    string(credentialsId: 'ci-pat', variable: 'CR_PAT'),
                    string(credentialsId: 'DOCKER_HUB_CREDENTIALS_ID', variable: 'DOCKER_PASSWORD')]) {
                        // Set the SSH key for authentication
                        withEnv(["GIT_SSH_COMMAND=ssh -o StrictHostKeyChecking=no -i ${env.SSH_KEY}"]) {
                            // Declaring env var here gives flexibility to modify within the scope
                            env.AZURE = "${params.NET}.azurecr.io"
                            def _azure = "${params.NET}.azurecr.io"
                            def _net = "${params.NET}"
                            env.TAG = "${params.NET}"
                            if (params.NET == "stagenet") {
                                sh 'echo $AZURE_STAGENET_ACCESS_TOKEN | docker login -u stagenet --password-stdin $AZURE'
                            } else if (params.NET == "mainnet") {
                                sh 'echo $AZURE_MAINNET_ACCESS_TOKEN | docker login -u mainnet --password-stdin $AZURE'
                            } else if (params.NET == "testnet") {
                                _azure = "${params.NET}1.azurecr.io"
                                sh """
                                    echo $AZURE_TESTNET_ACCESS_TOKEN | docker login -u testnet1 --password-stdin $_azure
                                """
                            }

                            // Overriding env var
                            env.AZURE = _azure
                            sh "/usr/bin/make azure-release AZURE=${env.AZURE} INCREMENT_TYPE=${params.BUILD_TYPE}"

                            // Capture environment variables from Makefile after release
                            def buildInfo = sh(script: "make print-vars INCREMENT_TYPE=${params.BUILD_TYPE}", returnStdout: true).trim().split('\n')
                            def envVars = [:]
                            buildInfo.each {
                                def (key, value) = it.split('=')
                                envVars[key.trim()] = value.trim()
                            }

                            // Assign values to Jenkins environment variables
                            env.GITREF = envVars['GITREF']
                            env.VERSION = envVars['VERSION']

                            // Verify the captured environment variables
                            echo "Captured GITREF: ${env.GITREF}"
                            echo "Captured VERSION: ${env.VERSION}"

                            def imageDigest = sh(
                                script: "docker inspect --format='{{index .RepoDigests 0}}' ${env.AZURE}/${IMAGENAME}:${GITREF}_${VERSION} | awk -F'@' '{print \$2}'",
                                returnStdout: true
                            ).trim()

                            echo "Image Digest: ${imageDigest}"

                            if (params.NET == 'mainnet') {
                                withCredentials([string(credentialsId: 'Gitops_PAT', variable: 'GIT_TOKEN')]) {
                                    sh """
                                        cd ${WORKSPACE}
                                        git clone https://${GIT_TOKEN}@github.com/dojimanetwork/helm_charts.git -b ci-pipeline-changes
                                        cd helm_charts
                                        sed -i "/^  frontend:/,/^  frontend:/s|^\\(\\s*tag:\\).*|\\1 ${GITREF}_${VERSION}|" dependency_charts/blockscout-v2-frontend/values.yaml
                                        sed -i "/^  frontend:/,/^  frontend:/s|^\\(\\s*hash:\\).*|\\1 \"${imageDigest}\"|" dependency_charts/blockscout-v2-frontend/values.yaml
                                        git add .
                                        git commit -m "Update mainnet_hash with image digest ${imageDigest}"
                                        git push origin ci-pipeline-changes
                                        cd ${WORKSPACE} && rm -r helm_charts
                                    """
                                }
                            } else if (params.NET == "testnet") {
                                withCredentials([string(credentialsId: 'Gitops_PAT', variable: 'GIT_TOKEN')]) {
                                    sh """
                                        cd ${WORKSPACE}
                                        git clone https://${GIT_TOKEN}@github.com/dojimanetwork/helm_charts.git -b azure_develop
                                        cd helm_charts
                                        sed -i 's/testnet_hash: .*/testnet_hash: \"${imageDigest}\"/' dependency_charts/blockscout-v2-frontend/values.yaml
                                        sed -i '/^image:/,/^  testnet:/s|testnet: .*|testnet: \"${GITREF}_${VERSION}\"|' dependency_charts/blockscout-v2-frontend/values.yaml
                                        git add .
                                        git commit -m "Update mainnet_hash with image digest ${imageDigest}"
                                        git push origin azure_develop
                                        cd ${WORKSPACE} && rm -r helm_charts
                                    """
                                }
                            } else if (params.NET == "stagenet") {
                                withCredentials([string(credentialsId: 'Gitops_PAT', variable: 'GIT_TOKEN')]) {
                                    sh """
                                        cd ${WORKSPACE}
                                        git clone https://${GIT_TOKEN}@github.com/dojimanetwork/helm_charts.git -b azure_stagenet
                                        cd helm_charts
                                        sed -i 's/stagenet_hash: .*/stagenet_hash: \"${imageDigest}\"/' dependency_charts/blockscout-v2-frontend/values.yaml
                                        sed -i '/^image:/,/^  stagenet:/s|stagenet: .*|stagenet: \"${GITREF}_${VERSION}\"|' dependency_charts/blockscout-v2-frontend/values.yaml
                                        git add .
                                        git commit -m "Update stagenet_hash with image digest ${imageDigest}"
                                        git push origin azure_stagenet
                                        cd ${WORKSPACE} && rm -r helm_charts
                                    """
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
