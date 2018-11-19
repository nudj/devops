#!/bin/bash

echo "TEST: $TEST"

RED='\033[0;31m'
NC='\033[0m' # No Color

function commonHelpMessage() {
  echo "Usage: $0 [-p project][-h]" >&2
  echo "  project : the CodeBuild project to execute" >&2
}


function parseCommonArguments() {
  if [ $# -eq 0 ];
  then
      commonHelpMessage
      exit 0
  fi

  while getopts ":p:h" opt; do
    case "$opt" in
      h)
        commonHelpMessage
        exit 0
        ;;
      p)
        echo "CodeBuild project $OPTARG";PROJECT="$OPTARG"
        ;;
      \?)
        echo "Invalid Option -$OPTARG" >&2
        commonHelpMessage
        exit 1
        ;;
      :)
        echo "Option -$OPTARG requires an argument" >&2
        exit 1
        ;;
      [?])
        commonHelpMessage
        exit 1
        ;;

    esac
  done

  if [ "$PROJECT" = "" ]; then
    echo "CodeBuild project parameter is missing"
    echo
    commonHelpMessage
    exit 1
  fi

}

function startBuildAndWait() {
  echo "ENVIRONMENT $ENVIRONMENT"
  ENVKEY=$(sol secret get -n envkey -e $ENVIRONMENT -c api)
  SQL_USER=$(sol secret get -n user -e $ENVIRONMENT -c db)
  SQL_PASS=$(sol secret get -n pass -e $ENVIRONMENT -c db)
  echo "ENVKEY $ENVKEY"
  buildId=$(aws codebuild start-build --region $AWS_DEFAULT_REGION --project-name $PROJECT --source-version $CF_REVISION --environment-variables-override name=SHA1,value=$CF_REVISION,type=PLAINTEXT name=BRANCH,value=$CIRCLE_BRANCH,type=PLAINTEXT name=NPM_TOKEN,value=$NPM_TOKEN,type=PLAINTEXT name=ENVKEY,value=$ENVKEY,type=PLAINTEXT name=SQL_USER,value=$SQL_USER,type=PLAINTEXT name=SQL_PASS,value=$SQL_PASS,type=PLAINTEXT name=TYPE,value=$TYPE,type=PLAINTEXT name=APP_NAME,value=$APP_NAME,type=PLAINTEXT| jq '.build.id' | tr -d '"')
  echo "TYPE $TYPE"

  buildJson=$(aws codebuild batch-get-builds --region $AWS_DEFAULT_REGION --ids $buildId)
  complete=$(echo $buildJson | jq '.builds[0].buildComplete' | tr -d '"')

  printf "Wait for CodeBuild project $PROJECT to complete .."
  until [ "$complete" = "true" ]; do
    sleep 5;

    n=$[$n+1]

    if [ "$n" = "120" ]; then
      echo "Failed to detect completion of CodeBuild for $PROJECT"
      exit 1
    fi

    buildJson=$(aws codebuild batch-get-builds --region $AWS_DEFAULT_REGION --ids $buildId)
    complete=$(echo $buildJson | jq '.builds[0].buildComplete' | tr -d '"')

    printf "."
  done

  printf "\nBuild complete : $complete\n"

  groupName=$(echo $buildJson | jq '.builds[0].logs.groupName' | tr -d '"')
  streamName=$(echo $buildJson | jq '.builds[0].logs.streamName' | tr -d '"')

  logsJson=$(aws logs get-log-events --region $AWS_DEFAULT_REGION --log-group-name $groupName --log-stream-name $streamName)

  echo $logsJson | jq -r '.events[].message|rtrimstr("\n")'

  buildStatus=$(echo $buildJson | jq '.builds[0].buildStatus' | tr -d '"')

  if [ "$buildStatus" = "FAILED" ]; then
    echo "CodeBuild for $PROJECT failed"
    exit 1
  fi
}


parseCommonArguments "$@"

startBuildAndWait
