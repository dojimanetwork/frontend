pipeline {
    agent any
    tools {
        dockerTool 'Docker'
    }
    environment {
        IMAGENAME = 'blockscout-v2' // Set the credentials ID as an environment variable
    }
    parameters {
        choice(name: 'BUILD_TYPE', choices: ['patch', 'minor', 'major' ], description: 'select version to build in develop')
        choice(name: 'NET', choices: ['testnet', 'stagenet', 'mainnet'], description: 'select net type to build')
        choice(name: 'CLOUD', choices: ['GCP', 'AZURE', 'AWS'], description: 'select cloud operator to push docker image')
    }
    stages {
        stage('GCP Release') {
            when {
                expression { return params.CLOUD == 'GCP' }
        	}
            environment {
                INCREMENT_TYPE="${params.BUILD_TYPE}"
                TAG="${params.NET}"
                GCR="asia-south1-docker.pkg.dev/prod-dojima/${params.NET}"
            }
            steps {
                script {
                 withCredentials([ sshUserPrivateKey(credentialsId: 'dojimanetwork', keyFileVariable: 'SSH_KEY'), \
                 string(credentialsId: 'gcloud-access-token', variable: 'GCLOUD_ACCESS_TOKEN'), \
                 string(credentialsId: 'ci-registry-user', variable: 'CI_REGISTRY_USER'), \
                 string(credentialsId: 'ci-registry', variable: 'CI_REGISTRY'), \
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
                    INCREMENT_TYPE="${params.BUILD_TYPE}"
                }
                steps {
                    script {
                     withCredentials([ sshUserPrivateKey(credentialsId: 'dojimanetwork', keyFileVariable: 'SSH_KEY'), \
                     string(credentialsId: 'azure-stagenet-cr-token', variable: 'AZURE_STAGENET_ACCESS_TOKEN'), \
                     string(credentialsId: 'azure-mainnet-cr-token', variable: 'AZURE_MAINNET_ACCESS_TOKEN'), \
                     string(credentialsId: 'azure-testnet-cr-token', variable: 'AZURE_TESTNET_ACCESS_TOKEN'), \
                     string(credentialsId: 'ci-registry-user', variable: 'CI_REGISTRY_USER'), \
                     string(credentialsId: 'ci-registry', variable: 'CI_REGISTRY'), \
                     string(credentialsId: 'ci-pat', variable: 'CR_PAT'),
                     string(credentialsId: 'DOCKER_HUB_CREDENTIALS_ID', variable: 'DOCKER_PASSWORD')]) {
                            // Set the SSH key for authentication
                             withEnv(["GIT_SSH_COMMAND=ssh -o StrictHostKeyChecking=no -i ${env.SSH_KEY}"]) {
                               // declaring env var here gives flexi to modify in the scope
                                // https://stackoverflow.com/questions/53541489/updating-environment-global-variable-in-jenkins-pipeline-from-the-stage-level
                                env.AZURE="${params.NET}.azurecr.io"
                                def _azure = "${params.NET}.azurecr.io"
                                def _net = "${params.NET}"
                                env.TAG="${params.NET}"
                                  if ( params.NET == "stagenet" ) {
                                    sh 'echo $AZURE_STAGENET_ACCESS_TOKEN | docker login -u stagenet --password-stdin $AZURE'
                                  } else if ( params.NET == "mainnet" ){
                                    sh 'echo $AZURE_MAINNET_ACCESS_TOKEN | docker login -u mainnet --password-stdin $AZURE'
                                  } else if ( params.NET == "testnet" ) {
                                    _azure = "${params.NET}1.azurecr.io"
                                    sh """
                                        echo $AZURE_TESTNET_ACCESS_TOKEN | docker login -u testnet1 --password-stdin $_azure
                                    """
                                  }

                                  // overriding env var
                                  env.AZURE=_azure
                                  sh 'make azure-release'
                             }
                        }
                    }
                }
        }
    }
}
