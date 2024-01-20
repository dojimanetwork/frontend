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
    }
    stages {
        stage('Release') {
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
    }
}
