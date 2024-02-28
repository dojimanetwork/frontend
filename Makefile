BRANCH?=$(shell git rev-parse --abbrev-ref HEAD | sed -e 's/develop/testnet/g;s/stage/stagenet/g;s/prod/mainnet/g')
GITREF=$(shell git rev-parse --short HEAD)
BUILDTAG?=$(shell git rev-parse --abbrev-ref HEAD | sed -e 's/prod/mainnet/g;s/develop/testnet/g;s/testnet-multichain/testnet/g;s/stage/stagenet/g')
# pull branch name from CI, if available
ifdef CI_COMMIT_BRANCH
	BRANCH=$(shell echo ${CI_COMMIT_BRANCH} | sed 's/master/mocknet/g')
	BUILDTAG=$(shell echo ${CI_COMMIT_BRANCH} | sed -e 's/master/mocknet/g;s/develop/mocknet/g;s/testnet-multichain/testnet/g;s/stage/stagenet/g')
endif
VERSION=$(shell bash ./get_next_tag.sh ${INCREMENT_TYPE})
TAG=$(shell date +%Y-%m-%d)
DATE=$(shell date +%Y-%m-%d)

# ------------------------------- GitLab ------------------------------- #
pull: ## Git pull repository
@git clean -idf
@git pull origin $(shell git rev-parse --abbrev-ref HEAD)

region-check:
@if [ -z "${REGION}" ]; then\
echo "add region env variable";\
exit 1;\
fi

ecr-check:
@if [ -z "${GCR}" ]; then\
echo "add gcr env variable";\
exit 1;\
fi
docker-push: ecr-check
docker push ${GCR}/${IMAGENAME}:${GITREF}_${VERSION}

docker-build: ecr-check pull
docker build -f ./Dockerfile -t ${GCR}/${IMAGENAME}:${GITREF}_${VERSION} .

push-tag:
bash ./push_tag.sh ${VERSION}

release: docker-build docker-push push-tag

push-only-image: docker-build docker-push
# ------------------------------------------------------------------ #